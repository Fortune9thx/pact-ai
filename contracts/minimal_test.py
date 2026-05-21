# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class VibeCheck(gl.Contract):
    counter: u256

    def __init__(self) -> None:
        self.counter = u256(0)

    @gl.public.view
    def get_counter(self) -> int:
        return int(self.counter)

    @gl.public.write
    def increment(self) -> None:
        self.counter += u256(1)
