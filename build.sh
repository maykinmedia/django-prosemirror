#!/bin/bash

export PYTHONPATH=. 
export DJANGO_SETTINGS_MODULE=testapp.settings
npx prettier --write js/index.js 
npm run build
cp dist/bundle.js django_prosemirror/static/js/django-prosemirror.js
cp dist/bundle.js.map django_prosemirror/static/js/bundle.js.map
cp dist/bundle.css django_prosemirror/static/css/django-prosemirror.css
django-admin collectstatic --no-input
