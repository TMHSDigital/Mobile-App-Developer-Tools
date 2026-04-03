import yaml


def _parse_frontmatter(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None
    end = text.index("---", 3)
    return yaml.safe_load(text[3:end])


def test_at_least_one_skill_exists(skill_dirs):
    assert len(skill_dirs) > 0, "No skills found under skills/"


def test_skill_has_frontmatter(skill_dirs):
    for skill_dir in skill_dirs:
        skill_file = skill_dir / "SKILL.md"
        fm = _parse_frontmatter(skill_file)
        assert fm is not None, f"{skill_file} missing YAML frontmatter"


def test_skill_frontmatter_has_name(skill_dirs):
    for skill_dir in skill_dirs:
        skill_file = skill_dir / "SKILL.md"
        fm = _parse_frontmatter(skill_file)
        assert "name" in fm, f"{skill_file} frontmatter missing 'name'"


def test_skill_frontmatter_has_description(skill_dirs):
    for skill_dir in skill_dirs:
        skill_file = skill_dir / "SKILL.md"
        fm = _parse_frontmatter(skill_file)
        assert "description" in fm, f"{skill_file} frontmatter missing 'description'"


def test_skill_name_matches_directory(skill_dirs):
    for skill_dir in skill_dirs:
        skill_file = skill_dir / "SKILL.md"
        fm = _parse_frontmatter(skill_file)
        dir_name = skill_dir.name
        fm_name = fm.get("name", "")
        assert dir_name == fm_name, (
            f"Skill name mismatch: directory={dir_name}, frontmatter name={fm_name}"
        )


def test_skill_has_required_sections(skill_dirs):
    required_sections = [
        "## Trigger",
        "## Required Inputs",
        "## Workflow",
        "## Example Interaction",
        "## MCP Usage",
        "## Common Pitfalls",
    ]
    for skill_dir in skill_dirs:
        skill_file = skill_dir / "SKILL.md"
        content = skill_file.read_text(encoding="utf-8")
        for section in required_sections:
            assert section in content, (
                f"{skill_file} missing required section: {section}"
            )
