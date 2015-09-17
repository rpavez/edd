
""" Miscellaneous data-processing utilities. """

import json
import re

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie
from functools import partial
from io import BytesIO

from . import gc_ms_workbench
from .parsers import excel, skyline
from main.forms import CreateStudyForm


def utilities_index (request) :
    return render(request, 'index.html', {})

########################################################################
# GC-MS
#
@ensure_csrf_cookie
def gcms_home(request):
    """Starting point for extracting peaks from ChemStation report files."""
    return render(request, 'gc_ms.html', {})

def gcms_parse(request):
    """ Process an Agilent MSDChemStation report and return a table of data as JSON string. """
    try:
        json_result = gc_ms_workbench.process_gc_ms_form_and_parse_file(
            form=request.POST,
            file=request.FILES['file'])
        assert isinstance(json_result, dict)
        return JsonResponse(json_result)
    except (AttributeError, KeyError, ValueError) as e:
        return JsonResponse({ 'python_error' : str(e) })

def gcms_merge(request):
    data = json.loads(request.body)
    try:
        return JsonResponse(gc_ms_workbench.finalize_gc_ms_spreadsheet(data))
    except RuntimeError as e:
        return JsonResponse({ 'python_error' : str(e) })

def gcms_export(request):
    form = request.POST
    try:
        prefix = form['prefix']
        headers = json.loads(form['headers'])
        table = json.loads(form['table'])
        assert (len(table) > 0)
        # XXX but note below that the Workbook needs to be created with specific
        # options, otherwise this won't work
        f = BytesIO(gc_ms_workbench.export_to_xlsx(table, headers))
        file_name = prefix + ".xlsx"
        response = HttpResponse(f,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response['Content-Disposition'] = 'attachment; filename="%s"' % file_name
        return response
    except Exception as e:
        messages.error(request, "Could not generate the GC-MS export file: %s" % e)
        return HttpResponse(status=500)
#

########################################################################
# PROTEOMICS
#
@ensure_csrf_cookie
def skyline_home(request):
    return render(request, 'skyline_import.html', {})

def skyline_parse(request):
    try:
        data = request.FILES['file'].read()
        result = skyline.ParseCSV(data.splitlines())
        assert (result is not None)
        return JsonResponse(result.export())
    except Exception as e:
        return JsonResponse({ 'python_error': str(e) })


########################################################################
# CYTOMETRY
#
def cytometry_home(request):
    study_form = CreateStudyForm(prefix='study')
    return render(request, 'cytometry.html', {
        'study_form': study_form,
        })

def cytometry_parse(request):
    upload = request.FILES.get('file', None)
    try:
        content_type = upload.content_type
        if content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            # read in all cells, replace all whitespace with a single space, output tab-delimited
            parsed = excel.import_xlsx_tables(upload)
            pattern = re.compile('\s+')
            replace = partial(pattern.sub, ' ')
            tables = []
            for sheet in parsed.get('worksheets', []):
                for ws in sheet:
                    header = ws.get('headers', [])
                    table = [ u'\t'.join(map(replace, map(unicode, header))) ] if header else []
                    for row in ws.get('values', []):
                        table.append(u'\t'.join(map(replace, map(unicode, row))))
                    tables.append(u'\n'.join(table))
            return JsonResponse({ 'data': u'\n\n'.join(tables) })
        else:
            # try to parse as plain text
            return JsonResponse({ 'data': upload.read() })
    except Exception as e:
        return JsonResponse({ 'python_error': str(e) })

def cytometry_import(request):
    if (request.method != "POST"):
        return redirect(reverse('edd_utils:cytometry_home'))
    if request.POST.get('create_study', None):
        study_form = CreateStudyForm(request.POST, prefix='study')
        if study_form.is_valid():
            study = study_form.save()
    else:
        study_form = CreateStudyForm(prefix='study')
        study = Study.objects.get(pk=request.POST.get('study_1', None))
    rawdata = request.POST.get('rawdata', '')
    print(request.POST)
    # use main.data_import.TableImport or similar
    return render(request, 'cytometry.html', {
        'study_form': study_form,
        })
