
# FIXME need to track intracellular and extracellular measurements separately
# (and assign to SBML species differently)
# TODO clean this up, get rid of unnecessary code and make it internally
# consistent
# TODO Garrett says we can get rid of the input checkboxes

# NOTE the structure of this module is more complicated than really necessary -
# basically I am using a class hierarchy to separate out three different areas
# of functionality:
#   1. processing the SBML model and determining what reactants/fluxes to use,
#      independently of the line(s) and assay(s) of interest (sbml_info)
#   2. processing the raw assay data and calculating fluxes (line_assay_data)
#   3. combining the assay data with the SBML model to export a new SBML file
#      (line_sbml_export)
# and technically, actually pulling down the relevant database records is
# handled by yet another class in utilities.py.
#
# Note that some "private" method names imply an ordering of steps which
# matches the layout export HTML view, but broken up among two classes.  These
# may be refactored in the future.
#
# There is no reason why this hierarchy can't be merged into a single class,
# but given the complexity of the module and the more-or-less discrete sets
# of functions, I find it more convenient to break them up.  This also
# facilitates later re-use, e.g. the analyses done by the sbml_info class are
# also used in the view for administration of metabolic maps, independently
# of assay data.  (To that extent, the structure mimics that of the old EDD,
# where this functionality and HTML output resided in UtilitiesSBML.pm.)
#
# -Nat 2015-03-27

# NOTE 2: a lot of Garrett's comments have been ported from the Perl code.
# some of these may need updating or removing.

# NOTE 3: I apologize for my reliance on underscores to indicate
# pseudo-"private" attributes and methods; it looks gross but it helps
# clarify the intent (at least in my own mind).

""" Backend for exporting SBML files. """

from __future__ import division, unicode_literals

import logging
import re
import sys

from collections import defaultdict, namedtuple, OrderedDict
from copy import copy
from decimal import Decimal
from django import forms
from django.core.exceptions import ValidationError
from django.db.models import Max, Min
from django.http import QueryDict
from django.template.defaulttags import register
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _
from functools import partial, reduce
from six import string_types
from threadlocals.threadlocals import get_current_request

from ..forms import (
    MetadataTypeAutocompleteWidget, SbmlExchangeAutocompleteWidget, SbmlSpeciesAutocompleteWidget
)
from ..models import (
    Measurement, MeasurementType, MeasurementValue, MetaboliteExchange, MetaboliteSpecies,
    MetadataType, Protocol, SBMLTemplate,
)
from ..utilities import interpolate_at


logger = logging.getLogger(__name__)


Range = namedtuple('Range', ['min', 'max'])


class SbmlForm(forms.Form):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('label_suffix', '')
        super(SbmlForm, self).__init__(*args, **kwargs)
        self.sbml_warnings = []


class SbmlExport(object):
    """ Controller class handling the data coming from SbmlForm objects, creating further SbmlForm
        objects based on previous input, and exporting an SBML file based on the inputs. """
    def __init__(self, sbml_template, *args, **kwargs):
        self._sbml_template = sbml_template
        self._match_fields = {}
        self._match_sbml_warnings = []
        self._max = self._min = None
        self._points = None
        self._measures = defaultdict(list)
        if sbml_template:
            self._sbml_obj = sbml_template.parseSBML()
            self._sbml_model = self._sbml_obj.getModel()

    def add_measurements(self, sbml_measurements):
        """ Add measurements to the export from a SbmlExportMeasurementsForm. """
        measurements = sbml_measurements.cleaned_data.get('measurement', [])
        interpolate = sbml_measurements.cleaned_data.get('interpolate', [])
        measurement_qs = Measurement.objects.filter(pk__in=measurements)
        types_qs = MeasurementType.objects.filter(measurement__in=measurements)
        types_list = list(types_qs.distinct())
        species_qs = MetaboliteSpecies.objects.filter(
            measurement_type__in=types_list,
            sbml_template=self._sbml_template,
        )
        species_match = {s.measurement_type_id: s for s in species_qs}
        exchange_qs = MetaboliteExchange.objects.filter(
            measurement_type__in=types_list,
            sbml_template=self._sbml_template,
        )
        exchange_match = {x.measurement_type_id: x for x in exchange_qs}
        # add fields matching species/exchange for every measurement type
        for t in types_list:
            key = '%s' % t.pk
            if key not in self._match_fields:
                i_species = species_match.get(t.pk, self._guess_species(t))
                i_exchange = exchange_match.get(t.pk, self._guess_exchange(t))
                self._match_fields[key] = SbmlMatchReactionField(
                    initial=(i_species, i_exchange),
                    label=t.type_name,
                    required=False,
                    template=self._sbml_template,
                )
        # store measurements keyed off type
        for m in measurements:
            self._measures['%s' % m.measurement_type_id].append(m)
        # capture lower/upper bounds of t values for all measurements
        trange = measurement_qs.aggregate(
            max_t=Max('measurementvalue__x'), min_t=Min('measurementvalue__x'),
        )
        # use 1e9 as really big number in place of None, get smallest min:max range over all
        if trange['max_t']:
            self._max = min(trange['max_t'][0], self._max or sys.maxint)
        if trange['min_t']:
            self._min = max(trange['min_t'][0], self._min or -sys.maxint)
        # iff no interpolation, capture intersection of t values bounded by max & min
        m_inter = measurement_qs.exclude(assay__protocol__in=interpolate)
        for m in m_inter.prefetch_related('measurementvalue_set'):
            points = set([
                p.x[0]
                for p in m.measurementvalue_set.all()
                if self._min <= p.x[0] <= self._max
            ])
            if self._points:
                self._points.intersection_update(points)
            else:
                self._points = points

    def create_match_form(self, payload, **kwargs):
        match = SbmlMatchReactions(
            data=payload,
            sbml_template=self._sbml_template,
            match_fields=self._match_fields,
            **kwargs
        )
        match.sbml_warnings.extend(self._match_sbml_warnings)
        return match

    def create_time_select_form(self, payload, **kwargs):
        # error if no range or if max < min
        if self._min is None or self._max is None or self._max < self._min:
            return None
        points = self._points
        t_range = Range(min=self._min, max=self._max)
        if points is not None:
            points = sorted(points)
        return SbmlExportSelectionForm(t_range=t_range, points=points, data=payload, **kwargs)

    def output(self, time, matches):
        # map species / reaction IDs to measurement IDs
        our_species = {}
        our_reactions = {}
        for mtype, match in matches.iteritems():
            if match:  # when not None, match[0] == species and match[1] == reaction
                if match[0] and match[0] not in our_species:
                    our_species[match[0]] = mtype
                if match[1] and match[1] not in our_reactions:
                    our_reactions[match[1]] = mtype
        print('\n\t\tspecies = %s :: reactions = %s' % (our_species, our_reactions, ))
        builder = SbmlBuilder()
        self._update_species_notes(builder, our_species, time)
        self._update_reaction_notes(builder, our_reactions, time)
        # TODO: add carbon data notes
        # TODO: add protein and transcription global notes
        return builder.write_to_string(self._sbml_obj)

    def _guess_exchange(self, measurement_type):
        mname = measurement_type.short_name
        mname_transcoded = generate_transcoded_metabolite_name(mname)
        guesses = [
            mname,
            mname_transcoded,
            "M_" + mname + "_e",
            "M_" + mname_transcoded + "_e",
            "M_" + mname_transcoded + "_e_",
        ]
        lookup = defaultdict(list)
        exchanges = MetaboliteExchange.objects.filter(
            reactant_name__in=guesses,
            sbml_template=self._sbml_template,
        )
        for x in exchanges:
            lookup[x.reactant_name].append(x)
        for guess in guesses:
            match = lookup.get(guess, None)
            if match:
                if len(match) > 1:
                    self._match_sbml_warnings.append(
                        _('Multiple exchanges found for %(type)s using %(guess)s. Selected '
                          'exchange %(match)s') % {
                            'guess': guess,
                            'match': match[0],
                            'type': measurement_type.type_name,
                        }
                    )
                return match[0]
        return None

    def _guess_species(self, measurement_type):
        guesses = generate_species_name_guesses_from_metabolite_name(measurement_type.short_name)
        lookup = {
            s.species: s
            for s in MetaboliteSpecies.objects.filter(
                sbml_template=self._sbml_template,
                species__in=guesses,
            )
        }
        for guess in guesses:
            if guess in lookup:
                return lookup[guess]
        return None

    def _update_reaction_notes(self, builder, our_reactions, time):
        # loop over all template reactions, if in our_reactions set bounds, notes, etc
        for reaction_sid, mtype in our_reactions.iteritems():
            reaction = self._sbml_model.getReaction(reaction_sid.encode('utf-8'))
            if reaction is None:
                print('No reaction found for %s' % reaction_sid)
                continue
            if reaction.isSetNotes():
                reaction_notes = reaction.getNotes()
            else:
                reaction_notes = builder.create_note_body()
            reaction_notes = builder.update_note_body(
                reaction_notes,
                GENE_TRANSCRIPTION_VALUES='',
                PROTEIN_COPY_VALUES='',
            )
            reaction.setNotes(reaction_notes)
            flux = 0
            kinetic_law = reaction.getKineticLaw()
            # NOTE: libsbml calls require use of 'binary' CStrings
            upper_bound = kinetic_law.getParameter(b"UPPER_BOUND")
            lower_bound = kinetic_law.getParameter(b"LOWER_BOUND")
            upper_bound.setValue(flux)
            lower_bound.setValue(flux)

    def _update_species_notes(self, builder, our_species, time):
        # loop over all template species, if in our_species set the notes section
        for species_sid, mtype in our_species.iteritems():
            print("Looking up species '%s'" % species_sid)
            species = self._sbml_model.getSpecies(species_sid.encode('utf-8'))
            if species is None:
                print('No species found for %s' % species_sid)
                continue
            measurements = self._measures.get('%s' % mtype)
            print('\n\t\tmeasurements = %s' % (measurements, ))
            current = minimum = maximum = ''
            try:
                values = MeasurementValue.objects.filter(
                    measurement__in=measurements
                ).order_by('x')
                minmax = values.aggregate(max=Max('y'), min=Min('y'))
                minimum = minmax['min']
                maximum = minmax['max']
                print('\n\t\ttime = %s :: values = %s' % (time, values))
                current = interpolate_at(values, time)
                print('\n\t\tFound current value = %s' % (current, ))
                # TODO: any necessary unit conversions
            except Exception as e:
                logger.warning('hit an error calculating species values: %s', type(e))
            print("checking for notes")
            if species.isSetNotes():
                print("using existing notes")
                species_notes = species.getNotes()
            else:
                print("creating new notes")
                species_notes = builder.create_note_body()
            print("updating notes node")
            species_notes = builder.update_note_body(
                species_notes,
                CONCENTRATION_CURRENT=current,
                CONCENTRATION_HIGHEST=maximum,
                CONCENTRATION_LOWEST=minimum,
            )
            print("saving notes node")
            species.setNotes(species_notes)
            print("saved notes node")


class SbmlExportSettingsForm(SbmlForm):
    """ Form used for selecting settings on SBML exports. """
    sbml_template = forms.ModelChoiceField(
        SBMLTemplate.objects.all(),  # TODO: potentially narrow options based on current user?
        label=_('SBML Template'),
    )

    def update_bound_data_with_defaults(self):
        """ Forces data bound to the form to update to default values. """
        if self.is_bound:
            # create mutable copy of QueryDict
            replace_data = QueryDict(mutable=True)
            replace_data.update(self.data)
            # set initial measurementId values
            field = self.fields['sbml_template']
            if field.initial:
                replace_data[self.add_prefix('sbml_template')] = '%s' % field.initial
            else:
                self.sbml_warnings.append(
                    _('No SBML template set for this study; a template must be selected to '
                      'export data as SBML.')
                )
            self.data = replace_data


@register.filter(name='scaled_x')
def scaled_x(point, x_range):
    """ Template filter calculates the relative X value for SVG sparklines. """
    return ((point.x[0] / x_range[1]) * 450) + 10


class MeasurementChoiceField(forms.ModelMultipleChoiceField):
    """ Custom ModelMultipleChoiceField that changes the display of measurement labels. """
    def label_from_instance(self, obj):
        return obj.full_name


class SbmlExportMeasurementsForm(SbmlForm):
    """ Form used for selecting measurements to include in SBML exports. """
    measurement = MeasurementChoiceField(
        queryset=Measurement.objects.none(),  # this is overridden in __init__()
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )
    interpolate = forms.ModelMultipleChoiceField(
        label=_('Allow interpolation for'),
        queryset=Protocol.objects.none(),  # this is overridden in __init__()
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )

    def __init__(self, selection, *args, **kwargs):
        """
        Required:
            selection = a main.export.ExportSelection object defining the items for export
        Optional:
            qfilter = arguments to filter a measurement queryset from
                main.export.table.ExportSelection
            baseline = another SbmlExportMeasurementsForm used to find timepoints where values
                should be interpolated
        """
        qfilter = kwargs.pop('qfilter', None)
        self._types = kwargs.pop('types', None)
        self._protocols = kwargs.pop('protocols', None)
        self._baseline = kwargs.pop('baseline', None)
        super(SbmlExportMeasurementsForm, self).__init__(*args, **kwargs)
        self._selection = selection
        measurement_queryset = self._init_measurement_field(qfilter)
        # depends on measurement field being initialized
        self._init_interpolate_field(measurement_queryset)

    def _init_interpolate_field(self, measurement_queryset):
        # do not show when there are no measurements, otherwise show the available protocols
        if measurement_queryset.count() == 0:
            del self.fields['interpolate']
        else:
            self.fields['interpolate'].queryset = Protocol.objects.filter(
                assay__measurement__in=measurement_queryset
            ).distinct()

    def _init_measurement_field(self, qfilter):
        f = self.fields['measurement']
        f.queryset = self._selection.measurements.order_by(
            'assay__protocol__name', 'assay__name',
        ).prefetch_related(
            'measurementvalue_set',
        )
        if qfilter is not None:
            f.queryset = f.queryset.filter(qfilter)
        if f.queryset.count() == 0:
            self.sbml_warnings.append(_('No protocols have usable data.'))
            f.initial = []
        else:
            f.initial = f.queryset
        return f.queryset

    def clean(self):
        """ Upon validation, also inserts interpolated value points matching points available in
            baseline measurements for the same line. """
        data = super(SbmlExportMeasurementsForm, self).clean()
        # TODO
        return data

    def form_without_measurements(self):
        """ Returns a copy of the form without the measurement field; this allows rendering in
            templates as, e.g. `form_var.form_without_measurements.as_p`. """
        fles = copy(self)
        fles.fields = OrderedDict(self.fields)
        del fles.fields['measurement']
        return fles

    def measurement_split(self):
        """ Generator which yields a Measurement object and the widget used to select the same. """
        for index, measurement in enumerate(self.measurement_list):
            yield (measurement, self.measurement_widgets[index])

    def protocol_split(self):
        """ Generator which yields a Protocol name and a list of
            (Measurement object, Measurement select widget) tuples. """
        prev_protocol = None
        items = []
        # loop over all the choices in the queryset
        for index, measurement in enumerate(self.measurement_list):
            protocol = measurement.assay.protocol
            # when the protocol changes, yield the protocol and the choices using it
            if protocol != prev_protocol:
                if prev_protocol is not None:
                    yield (prev_protocol, items)
                prev_protocol = protocol
                items = []
            items.append((measurement, self.measurement_widgets[index]))
        # at the end, yield the final choices
        if prev_protocol is not None:
            yield (prev_protocol, items)

    def x_range(self):
        """ Returns the bounding range of X-values used for all Measurements in the form. """
        f = self.fields['measurement']
        x_range = f.queryset.aggregate(
            max=Max('measurementvalue__x'), min=Min('measurementvalue__x')
        )
        # can potentially get None if there are no values; use __getitem__ default AND `or [0]`
        x_max = x_range.get('max', [0]) or [0]
        x_min = x_range.get('min', [0]) or [0]
        # max and min are both still arrays, grab the first element
        return (x_min[0], x_max[0])

    def _get_measurements(self):
        # lazy eval and try not to query more than once
        # NOTE: still gets evaled at least three times: populating choices, here, and validation
        if not hasattr(self, '_measures'):
            field = self.fields['measurement']
            self._measures = list(field.queryset)
        return self._measures
    measurement_list = property(_get_measurements,
                                doc='A list of Measurements included in the form')

    def _get_measurement_widgets(self):
        # lazy eval and try not to query more than once
        if not hasattr(self, '_measure_widgets'):
            widgets = self['measurement']
            self._measure_widgets = list(widgets)
        return self._measure_widgets
    measurement_widgets = property(_get_measurement_widgets,
                                   doc='A list of widgets used to select Measurements')


class SbmlExportOdForm(SbmlExportMeasurementsForm):
    DEFAULT_GCDW_FACTOR = Decimal('0.65')
    PREF_GCDW_META = 'export.sbml.gcdw_metadata'
    gcdw_conversion = forms.ModelChoiceField(
        empty_label=None,
        help_text=_('Select the metadata containing the conversion factor for Optical Density '
                    'to grams carbon dry-weight per liter.'),
        label=_('gCDW/L/OD factor metadata'),
        queryset=MetadataType.objects.filter(),
        required=False,
        widget=MetadataTypeAutocompleteWidget,
    )
    gcdw_default = forms.DecimalField(
        help_text=_('Override the default conversion factor used if no metadata value is found.'),
        initial=DEFAULT_GCDW_FACTOR,
        label=_('Default gCDW/L/OD factor'),
        min_value=Decimal(0),
        required=True,
    )
    field_order = ['gcdw_default', 'gcdw_conversion', 'interpolate', ]

    def clean(self):
        data = super(SbmlExportOdForm, self).clean()
        gcdw_default = data.get('gcdw_default', self.DEFAULT_GCDW_FACTOR)
        conversion_meta = data.get('gcdw_conversion', None)
        if conversion_meta is None:
            self.sbml_warnings.append(mark_safe(
                _('No gCDW/L/OD metadata selected, all measurements will be converted with the '
                  'default factor of <b>%(factor)f</b>.') % {'factor': gcdw_default}
            ))
        else:
            self._clean_check_for_gcdw(data, gcdw_default, conversion_meta)
        # make sure that at least some OD measurements are selected
        if len(data.get('measurement', [])) == 0:
            raise ValidationError(
                _('No Optical Data measurements were selected. Biomass measurements are essential '
                  'for flux balance analysis.'),
                code='OD-required-for-FBA'
            )
        return data

    def _clean_check_for_curve(self, data):
        """ Ensures that each unique selected line has at least two points to calculate a
            growth curve. """
        for line in self._clean_collect_data_lines(data).itervalues():
            count = 0
            for m in self._measures_by_line[line.pk]:
                count += len(m.measurementvalue_set.all())
                if count > 1:
                    break
            if count < 2:
                raise ValidationError(
                    _('Optical Data for %(line)s contains less than two data points. Biomass '
                      'measurements are essential for FBA, and at least two are needed to define '
                      'a growth rate.') % {'line': line.name},
                    code='growth-rate-required-for-FBA'
                )

    def _clean_check_for_gcdw(self, data, gcdw_default, conversion_meta):
        """ Ensures that each unique selected line has a gCDW/L/OD factor. """
        # warn for any lines missing the selected metadata type
        for line in self._clean_collect_data_lines(data).itervalues():
            factor = line.metadata_get(conversion_meta)
            # TODO: also check that the factor in metadata is a valid value
            if factor is None:
                self.sbml_warnings.append(
                    _('Could not find metadata %(meta)s on %(line)s; using default factor '
                      'of <b>%(factor)f</b>.') % {
                        'factor': gcdw_default,
                        'line': line.name,
                        'meta': conversion_meta.type_name,
                      }
                )

    def _clean_collect_data_lines(self, data):
        """ Collects all the lines included in a data selection. """
        if not hasattr(self, '_lines'):
            self._lines = {}
            self._measures_by_line = defaultdict(list)
            # get unique lines first
            for m in data.get('measurement', []):
                self._lines[m.assay.line.pk] = m.assay.line
                self._measures_by_line[m.assay.line.pk].append(m)
        return self._lines

    def _init_conversion(self):
        """ Attempt to load a default initial value for gcdw_conversion based on user. """
        request = get_current_request()
        if request and request.user:
            prefs = request.user.profile.prefs
            try:
                return MetadataType.objects.get(pk=prefs[self.PREF_GCDW_META])
            except:
                pass
        # TODO: load preferences from the system user if no request user
        return None

    def update_bound_data_with_defaults(self):
        """ Forces data bound to the form to update to default values. """
        if self.is_bound:
            # create mutable copy of QueryDict
            replace_data = QueryDict(mutable=True)
            replace_data.update(self.data)
            # set initial measurement values
            mfield = self.fields['measurement']
            replace_data.setlist(
                self.add_prefix('measurement'),
                ['%s' % v.pk for v in mfield.initial]
            )
            # set initial gcdw_conversion values
            cfield = self.fields['gcdw_conversion']
            if cfield.initial:
                name = self.add_prefix('gcdw_conversion')
                for i, part in enumerate(cfield.widget.decompress(cfield.initial)):
                    replace_data['%s_%s' % (name, i)] = part
            # set initial gcdw_default value
            dfield = self.fields['gcdw_default']
            replace_data[self.add_prefix('gcdw_default')] = '%s' % dfield.initial
            self.data = replace_data


class SbmlMatchReactionWidget(forms.widgets.MultiWidget):
    def __init__(self, template, attrs=None):
        widgets = (
            SbmlSpeciesAutocompleteWidget(template),
            SbmlExchangeAutocompleteWidget(template),
        )
        super(SbmlMatchReactionWidget, self).__init__(widgets, attrs)

    def decompress(self, value):
        if value is None:
            return ('', '')
        return value  # value is a tuple anyway

    def format_output(self, rendered_widgets):
        return '</td><td>'.join(rendered_widgets)


class SbmlMatchReactionField(forms.MultiValueField):
    def __init__(self, template, *args, **kwargs):
        fields = (forms.CharField(), forms.CharField())  # these are only placeholders
        self.widget = SbmlMatchReactionWidget(template)
        super(SbmlMatchReactionField, self).__init__(fields, *args, **kwargs)

    def compress(self, data_list):
        if data_list:
            # TODO validation
            return (data_list[0], data_list[1])
        return None


class SbmlMatchReactions(SbmlForm):
    def __init__(self, sbml_template, match_fields, *args, **kwargs):
        super(SbmlMatchReactions, self).__init__(*args, **kwargs)
        self._sbml_template = sbml_template
        self.fields.update(match_fields)

    def clean(self):
        # TODO
        return super(SbmlMatchReactions, self).clean()


class SbmlExportSelectionForm(forms.Form):
    time_select = forms.DecimalField(
        help_text=_('Select the time to compute fluxes for embedding in SBML template'),
        label=_('Time for export'),
    )

    def __init__(self, t_range, points=None, *args, **kwargs):
        super(SbmlExportSelectionForm, self).__init__(*args, **kwargs)
        time_field = self.fields['time_select']
        if points:
            self.fields['time_select'] = forms.TypedChoiceField(
                choices=[('%s' % t, '%s hr' % t) for t in points],
                coerce=Decimal,
                empty_value=None,
                help_text=time_field.help_text,
                label=time_field.label,
            )
        else:
            time_field.max_value = t_range.max
            time_field.min_value = t_range.min
            time_field.initial = t_range.min
            time_field.help_text = _(
                'Select the time to compute fluxes for embedding in SBML template (in the range '
                '%(min)s to %(max)s)'
            ) % t_range._asdict()


class SbmlBuilder(object):
    """ A little facade class to provide better interface to libsbml and some higher-level
        utilities to work with SBML files. """
    def __init__(self):
        import libsbml
        self.libsbml = libsbml

    def create_note_body(self):
        body_tag = self.libsbml.XMLTriple(b"body", b"", b"")
        attributes = self.libsbml.XMLAttributes()
        namespace = self.libsbml.XMLNamespaces()
        namespace.add(b"http://www.w3.org/1999/xhtml", b"")
        body_token = self.libsbml.XMLToken(body_tag, attributes, namespace)
        body_node = self.libsbml.XMLNode(body_token)
        return body_node

    def parse_note_body(self, node):
        notes = {}
        if node is None:
            return notes
        note_body = node
        if note_body.hasChild(b'body'):
            note_body = note_body.getChild(0)
        # API not very pythonic, cannot just iterate over children
        for index in range(note_body.getNumChildren()):
            p = note_body.getChild(index)
            if p.getNumChildren() > 1:
                text = p.getChild(0).toXMLString()
                key, value = text.split(':')
                key = key.strip()
                notes[key] = p.getChild(1)
            elif p.getNumChildren() == 1:
                text = p.getChild(0).toXMLString()
                key, value = text.split(':')
                notes[key.strip()] = value.strip()
        return notes

    def update_note_body(self, _body_node, **kwargs):
        # ensure adding to the <body> node
        if _body_node.hasChild(b'body'):
            _body_node = _body_node.getChild(0)
        attributes = self.libsbml.XMLAttributes()
        namespace = self.libsbml.XMLNamespaces()
        p_tag = self.libsbml.XMLTriple(b"p", b"", b"")
        p_token = self.libsbml.XMLToken(p_tag, attributes, namespace)
        notes = self.parse_note_body(_body_node)
        notes.update(**kwargs)
        for key, value in notes.iteritems():
            encode_key = key.encode('utf-8')
            text = None
            if isinstance(value, string_types):
                value = value.encode('utf-8')
                text = ('%s: %s' % (encode_key, value)).encode('utf-8')
            else:
                text = ('%s: ' % encode_key).encode('utf-8')
            text_token = self.libsbml.XMLToken(text)
            text_node = self.libsbml.XMLNode(text_token)
            p_node = self.libsbml.XMLNode(p_token)
            p_node.addChild(text_node)
            if isinstance(value, self.libsbml.XMLNode):
                p_node.addChild(value)
            _body_node.addChild(p_node)
        return _body_node

    def write_to_string(self, document):
        return self.libsbml.writeSBMLToString(document)


def compose(*args):
    """ Composes argument functions and returns resulting function;
        e.g. compose(f, g)(x) == f(g(x)) """
    return reduce(lambda f, g: lambda x: f(g(x)), args, lambda x: x)

# functions to substitute character sequences in a string
dash_sub = partial(re.compile(r'-').sub, '_DASH_')
lparen_sub = partial(re.compile(r'\(').sub, '_LPAREN_')
rparen_sub = partial(re.compile(r'\)').sub, '_RPAREN_')
lsqbkt_sub = partial(re.compile(r'\[').sub, '_LSQBKT_')
rsqbkt_sub = partial(re.compile(r'\]').sub, '_RSQBKT_')
transcode = compose(dash_sub, lparen_sub, rparen_sub, lsqbkt_sub, rsqbkt_sub)


# "Transcoded" means that we make it friendlier for SBML species names,
# which means we translate symbols that are allowed in EDD metabolite names
# like "-" to things like "_DASH_".
def generate_transcoded_metabolite_name(mname):
    # This is a hack to adapt two specific metabolites from their
    # "-produced" and "-consumed" variants to their ordinary names.
    # It's needed here because the original variants are considered
    # "rates", while the metabolites we're matching to are not.
    if (mname == "CO2p"):
        mname = "co2"
    elif (mname == "O2c"):
        mname = "o2"
    return transcode(mname)


# This returns an array of possible SBML species names from a metabolite name.
# FIXME should this distinguish between compartments?
def generate_species_name_guesses_from_metabolite_name(mname):
    mname_transcoded = generate_transcoded_metabolite_name(mname)
    return [
        mname,
        mname_transcoded,
        "M_" + mname + "_c",
        "M_" + mname_transcoded + "_c",
        "M_" + mname_transcoded + "_c_",
    ]


########################################################################
# ADMIN FEATURES
#
def validate_sbml_attachment(file_data):
    import libsbml
    sbml = libsbml.readSBMLFromString(file_data)
    errors = sbml.getErrorLog()
    if (errors.getNumErrors() > 0):
        raise ValueError(errors.getError(1).getMessage())
    model = sbml.getModel()
    assert (model is not None)
    return sbml
