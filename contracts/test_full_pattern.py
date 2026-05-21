# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

STATUS_A = "A"
STATUS_B = "B"


class TestFull(gl.Contract):
    data: TreeMap[str, str]
    count: u256

    def __init__(self) -> None:
        self.count = u256(0)

    @gl.public.write
    def run_ai(self, key: str, url: str, desc: str) -> None:
        self._evaluate(key, url, desc)

    def _evaluate(self, key: str, url: str, desc: str) -> None:
        def compute() -> str:
            try:
                content = gl.nondet.web.render(url, mode="text")[:2000]
            except Exception:
                content = f"[unavailable]\n{desc}"

            task = f"""Evaluate this: {desc}
URL: {url}
Content: {content[:500]}
Respond with JSON: {{"result":"PASS or FAIL","score":0-100}}"""

            raw = gl.nondet.exec_prompt(task).strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.dumps(json.loads(raw.strip()), sort_keys=True)

        result = gl.eq_principle.strict_eq(compute)
        v = json.loads(result)
        self.data[key] = json.dumps({"result": v.get("result", "FAIL"), "score": int(v.get("score", 0))})
        self.count += u256(1)

    @gl.public.view
    def get(self, key: str) -> dict:
        assert key in self.data, "Not found"
        return json.loads(self.data[key])
