import json
import pathlib

import pytest


REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent


@pytest.fixture
def repo_root():
    return REPO_ROOT


@pytest.fixture
def plugin_manifest(repo_root):
    manifest_path = repo_root / ".cursor-plugin" / "plugin.json"
    assert manifest_path.exists(), f"plugin.json not found at {manifest_path}"
    with open(manifest_path) as f:
        return json.load(f)


@pytest.fixture
def skill_dirs(repo_root):
    skills_root = repo_root / "skills"
    if not skills_root.exists():
        return []
    return sorted(
        d for d in skills_root.iterdir() if d.is_dir() and (d / "SKILL.md").exists()
    )


@pytest.fixture
def rule_files(repo_root):
    rules_root = repo_root / "rules"
    if not rules_root.exists():
        return []
    return sorted(rules_root.glob("*.mdc"))


@pytest.fixture
def mcp_package_json(repo_root):
    pkg_path = repo_root / "mcp-server" / "package.json"
    assert pkg_path.exists(), f"mcp-server/package.json not found at {pkg_path}"
    with open(pkg_path) as f:
        return json.load(f)
