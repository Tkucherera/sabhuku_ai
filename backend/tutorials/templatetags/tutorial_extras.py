import json

from django import template
from django.templatetags.static import static


register = template.Library()


@register.filter
def to_json(value):
    return json.dumps(value)


@register.simple_tag
def tutorial_fallback_image():
    return static("tutorials/images/tutorial-fallback.svg")

