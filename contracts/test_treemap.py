# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class TestMap(gl.Contract):
    data: TreeMap[str, str]
    count: u256

    def __init__(self) -> None:
        self.count = u256(0)

    @gl.public.view
    def get(self, key: str) -> str:
        return self.data[key] if key in self.data else ""

    @gl.public.write
    def set(self, key: str, value: str) -> None:
        self.data[key] = value
        self.count += u256(1)

    @gl.public.view
    def get_count(self) -> int:
        return int(self.count)
