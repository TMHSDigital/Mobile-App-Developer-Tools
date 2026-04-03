import yaml


def _parse_frontmatter(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None
    end = text.index("---", 3)
    return yaml.safe_load(text[3:end])


def test_at_least_one_rule_exists(rule_files):
    assert len(rule_files) > 0, "No rules found under rules/"


def test_rule_has_frontmatter(rule_files):
    for rule_file in rule_files:
        fm = _parse_frontmatter(rule_file)
        assert fm is not None, f"{rule_file} missing YAML frontmatter"


def test_rule_frontmatter_has_description(rule_files):
    for rule_file in rule_files:
        fm = _parse_frontmatter(rule_file)
        assert "description" in fm, f"{rule_file} frontmatter missing 'description'"


def test_rule_frontmatter_has_always_apply(rule_files):
    for rule_file in rule_files:
        fm = _parse_frontmatter(rule_file)
        assert "alwaysApply" in fm, f"{rule_file} frontmatter missing 'alwaysApply'"


def test_rule_scoped_rules_have_globs(rule_files):
    for rule_file in rule_files:
        fm = _parse_frontmatter(rule_file)
        if fm.get("alwaysApply") is False:
            assert "globs" in fm, (
                f"{rule_file} has alwaysApply=false but missing 'globs'"
            )
