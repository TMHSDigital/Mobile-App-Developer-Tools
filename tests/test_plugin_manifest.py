import pathlib


def test_plugin_manifest_has_required_fields(plugin_manifest):
    required = ["name", "displayName", "version", "description", "author", "license"]
    for field in required:
        assert field in plugin_manifest, f"plugin.json missing required field: {field}"


def test_plugin_manifest_author_has_name(plugin_manifest):
    author = plugin_manifest.get("author", {})
    assert "name" in author, "plugin.json author missing 'name'"
    assert "url" in author, "plugin.json author missing 'url'"


def test_plugin_manifest_references_valid_paths(plugin_manifest, repo_root):
    skills_path = plugin_manifest.get("skills", "")
    rules_path = plugin_manifest.get("rules", "")

    if skills_path:
        resolved = repo_root / skills_path.lstrip("./")
        assert resolved.exists(), f"skills path does not exist: {resolved}"

    if rules_path:
        resolved = repo_root / rules_path.lstrip("./")
        assert resolved.exists(), f"rules path does not exist: {resolved}"


def test_plugin_manifest_logo_exists(plugin_manifest, repo_root):
    logo = plugin_manifest.get("logo", "")
    if logo:
        resolved = repo_root / logo
        assert resolved.exists(), f"logo file does not exist: {resolved}"


def test_plugin_manifest_version_format(plugin_manifest):
    version = plugin_manifest.get("version", "")
    parts = version.split(".")
    assert len(parts) == 3, f"Version should be semver (x.y.z), got: {version}"
    for part in parts:
        assert part.isdigit(), f"Version part is not numeric: {part} in {version}"


def test_version_consistency(plugin_manifest, mcp_package_json, repo_root):
    plugin_ver = plugin_manifest["version"]
    mcp_ver = mcp_package_json["version"]
    assert plugin_ver == mcp_ver, (
        f"Version mismatch: plugin.json={plugin_ver}, mcp-server/package.json={mcp_ver}"
    )

    index_path = repo_root / "mcp-server" / "src" / "index.ts"
    if index_path.exists():
        content = index_path.read_text()
        assert f'version: "{plugin_ver}"' in content, (
            f"mcp-server/src/index.ts does not contain version: \"{plugin_ver}\""
        )
