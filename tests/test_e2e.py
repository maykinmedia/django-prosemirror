import os

import pytest
from playwright.sync_api import Page, expect

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "1"


pytestmark = [pytest.mark.browser_context_args(record_video_dir="playwright-videos/")]


def test_entered_text_is_maintained(live_server, page: Page):
    page.goto(f"{live_server.url}/form")

    editor = page.locator("[data-prosemirror-id=id_heading_only]")
    editor.click()
    editor.type("The chicken is in picadilly square")

    with page.expect_navigation():
        btn = page.locator("#submit-btn")
        btn.click()

    editor = page.locator("[data-prosemirror-id=id_heading_only]")
    expect(editor).to_contain_text("The chicken is in picadilly square")
