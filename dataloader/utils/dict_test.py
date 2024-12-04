import pytest

from .dict import dot_path, pick


class TestDotPath:
    @pytest.fixture
    def obj(self):
        return {"1st": {"2nd": {"3rd": 42}}}

    def test_dot_path(self, obj):
        assert dot_path(obj, "1st.2nd.3rd") == 42

    def test_dot_path_invalid(self, obj):
        with pytest.raises(KeyError):
            dot_path(obj, "1st.3rd")


class TestPick:
    @pytest.fixture
    def obj(self):
        return {"1st": 1, "2nd": 2, "3rd": 3}

    def test_pick(self, obj):
        assert pick(obj, ["1st"]) == {"1st": 1}

    def test_dot_empty(self, obj):
        assert pick(obj, []) == {}
