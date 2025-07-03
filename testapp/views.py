from django.http import HttpResponse
from django.template import RequestContext, Template
from django.views.decorators.csrf import csrf_exempt

from testapp.forms import TestForm, TestModelForm

INDEX_HTML = """<!DOCTYPE html>
<html>
<head>
    <title>Django ProseMirror Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .demo-links { list-style: none; padding: 0; }
        .demo-links li { margin: 10px 0; }
        .demo-links a { 
            display: inline-block; 
            padding: 10px 15px; 
            background: #007cba; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
        }
        .demo-links a:hover { background: #005a87; }
        .description { color: #666; margin-left: 10px; }
    </style>
</head>
<body>
    <h1>Django ProseMirror Demo</h1>
    <p>Choose a demo to explore ProseMirror integration with Django forms:</p>
    
    <ul class="demo-links">
        <li>
            <a href="/form">Regular Form Demo</a>
            <span class="description">Test ProseMirror with Django forms</span>
        </li>
        <li>
            <a href="/model-form">Model Form Demo</a>
            <span class="description">Test ProseMirror with Django model forms</span>
        </li>
        <li>
            <a href="/admin/">Django Admin</a>
            <span class="description">View ProseMirror fields in admin interface</span>
        </li>
    </ul>
</body>
</html>
"""


def index_view(request):
    """Root view showing links to demo pages."""
    return HttpResponse(INDEX_HTML)


FORM_TEMPLATE = """{% load static django_prosemirror %}
<!DOCTYPE html>
<html>
<head>
    {% include_django_prosemirror_css %}
    {% include_django_prosemirror_js_defer %}
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
    </style>
    <title>Simple Form Page</title>
</head>
<body>
    <h1>Form demo: {{ form_type }}</h1>
    <form method="post" action="">
        {% csrf_token %}
        {{ form.as_p }}
        <button type="submit" id="submit-btn">Submit</button>
    </form>
</body>
</html>
"""


@csrf_exempt
def simple_form_view(request):
    """Simple form view for testing ProseMirror form fields."""
    form = TestForm(request.POST)
    if request.method == "POST":
        form.is_valid()

    template = Template(FORM_TEMPLATE)
    context = RequestContext(
        request,
        {
            "form": form,
            "form_type": "non-model",
        },
    )

    rendered_html = template.render(context)
    return HttpResponse(rendered_html)


@csrf_exempt
def model_form_view(request):
    """Model form view for testing ProseMirror model fields."""
    if request.method == "POST":
        form = TestModelForm(request.POST)
        if form.is_valid():
            form.save()
    else:
        form = TestModelForm()

    template = Template(FORM_TEMPLATE)
    context = RequestContext(
        request,
        {
            "form": form,
            "form_type": "model",
        },
    )

    rendered_html = template.render(context)
    return HttpResponse(rendered_html)
