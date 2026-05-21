# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class TestPrivate(gl.Contract):
    data: TreeMap[str, str]

    def __init__(self) -> None:
        pass

    @gl.public.view
    def get(self, key: str) -> str:
        return self.data[key] if key in self.data else ""

    @gl.public.write
    def set_via_private(self, key: str, value: str) -> None:
        self._store(key, value)

    def _store(self, key: str, value: str) -> None:
        self.data[key] = value

    @gl.public.write
    def set_with_eq(self, key: str) -> None:
        def compute() -> str:
            return json.dumps({"key": key, "result": "ok"}, sort_keys=True)
        result = gl.eq_principle.strict_eq(compute)
        self.data[key] = result
