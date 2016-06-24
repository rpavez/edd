# coding: utf-8
from __future__ import unicode_literals

import logging

from allauth.account import app_settings as allauth_settings
from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount import providers
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.backends import ModelBackend
from django_auth_ldap.backend import LDAPBackend
from django.contrib import messages
from django.shortcuts import redirect
from django.utils.translation import ugettext_lazy as _

from main.models import User

logger = logging.getLogger(__name__)


class EDDAccountAdapter(DefaultAccountAdapter):
    """ Adapter overrides default behavior for username selection and email verification. """

    def populate_username(self, request, user):
        """ Takes a partial user, and sets the username if missing based on existing fields. """
        from allauth.account.utils import user_username, user_email, user_field
        first_name = user_field(user, 'first_name')
        last_name = user_field(user, 'last_name')
        email = user_email(user)
        username = user_username(user)
        if allauth_settings.USER_MODEL_USERNAME_FIELD:
            username = username or self.generate_unique_username([
                email, first_name, last_name, 'user',
            ])
            user_username(user, username)


class EDDSocialAccountAdapter(DefaultSocialAccountAdapter):
    """ Adapter overrides default behavior if a social account is using an email for an existing
        account. """

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return
        if 'email' not in sociallogin.account.extra_data:
            return
        qs = EmailAddress.objects.filter(email__iexact=sociallogin.account.extra_data['email'])
        if qs.exists():
            user = qs[0].user
            account = user.socialaccount_set.first()
            provider = providers.registry.by_id(account.provider) if account else None
            social = providers.registry.by_id(sociallogin.account.provider)
            messages.error(
                request,
                _('A %(provider)s account already exists for %(email)s. Please log in with that '
                  'account and link with your %(social)s account on the profile page.') % {
                    'provider': provider.name if provider else _('local or LDAP'),
                    'email': user.email,
                    'social': social.name,
                }
            )
            raise ImmediateHttpResponse(redirect('/accounts/login'))


class AllauthLDAPBackend(LDAPBackend):
    """ Extension of the Authentication Backend from django_auth_ldap, which creates a verified
        EmailAddress for django-allauth from the email in the LDAP record. """

    def authenticate(self, username, password, **kwargs):
        user = super(AllauthLDAPBackend, self).authenticate(username, password, **kwargs)
        if user and user.email:
            try:
                qs = EmailAddress.objects.filter(user=user, email__iexact=user.email)
                set_primary = EmailAddress.objects.get_primary(user) is None
                if qs.filter(verified=False).exists():
                    qs.update(verified=True)
                elif not qs.exists():
                    EmailAddress.objects.create(
                        user=user, email=user.email, verified=True, primary=set_primary,
                    )
            except Exception:
                logger.exception('Failed to check or update email verification from LDAP!')
        return user


class LocalTestBackend(ModelBackend):

    def authenticate(self, username=None, password=None, **kwargs):
        queryset = User.objects.filter(username=username)
        return queryset.first()
