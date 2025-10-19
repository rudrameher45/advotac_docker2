"""
Manual smoke test for the document analysis endpoint.

Run the FastAPI server (for example):
    uvicorn fastapi.main:app --reload --port 8000

Then execute:
    python3 fastapi/test_analysis.py
"""

import json
import os
import sys
from typing import Any, Dict

import requests

DEFAULT_ENDPOINT = os.getenv("ADVOTAC_ANALYSIS_ENDPOINT", "http://localhost:8000/api/assistant/analysis")

LEGAL_SAMPLE = """PRASAD PRADHAN & ANR.
 v.
 THE STATE OF CHHATTISGARH
 (Criminal Appeal No. 2025 of 2022)
 JANUARY 24, 2023
 [KRISHNA MURARI AND S. RAVINDRA BHAT, JJ.]
 Penal Code, 1860 – s.302 r/w s.34 – Murder – Prosecution
 case that appellant/accused and the victim were cousins – On the
 afternoon of 28.02.2012, when the victim was getting his land
 levelled through a JCB machine, the appellants (A-1 and A-2)
 reached the place and attacked him – It was alleged that A-1 was
 armed with an axe and he attacked the victim on the head – Against
 A-2, the allegation was that he was armed with an axe and had
 assaulted the victim on the legs – Regarding A-3, the grandson of
 A-1 and son of A-2, the allegation was that he went to the spot and
 caught hold of the victim – Victim sustained several injuries including
 head injuries – He was taken to the hospital and was examined by
 a doctor (PW11) – As serious head injuries were involved, the victim
 was operated by another doctor (PW15) – However, the victim could
 not survive and died on 22.03.2012 – PW14, doctor conducted the
 post-mortem and, in his report, (Ex. P-28), stated that death was
 caused by injuries sustained by the victim on the head – Trial Court
 convicted all the accused and sentenced them to life imprisonment,
 for the offence of murder, and six months rigorous imprisonment
 for the offence u/s.323 IPC – High Court acquitted A-3 on both
 counts, but affirmed the conviction and sentence of the appellants
 (A1 and A2) – Held: The nature of the attack by the appellants and
 the quality of eyewitness testimony of prosecution witnesses,
 especially PW1 to PW5, cannot be doubted – The circumstance that
 most of the witnesses were related to the deceased does not per se
 exclude their testimony– Appellants were armed, a fact which shows
 pre-meditation on their part – Appellants attacked victim on the
 head, which is a vital part of the body, thus taking undue advantage
 of their situation – Lapse of time i.e. victim dying after 20 days,
 would not per se constitute a determinative factor as to diminish the
 offender’s liability from the offence of murder to that of culpable
 homicide, not amounting to murder – Conviction and sentence
 imposed on the appellants, upheld.
 Dismissing the appeal, the Court
 HELD:1. The circumstance that most of the witnesses were
 related to the deceased does not per se exclude their testimony.
 Although PW1 is the deceased’s daughter, that is insufficient to
 doubt the veracity of what she recounted during the trial, which
 is that she saw the appellants attack her father with axes. She
 tried to intervene and save the deceased, upon which she was
 also given axe blows on her leg. There is no explanation on the
 part of the appellants as to why the witness should depose falsely;
 nor is there any explanation as to how she could have received
 her injuries. Most importantly, her testimony is corroborated by
 PW2, PW3 and PW4.
 2. To determine the culpability of appellants whether they
 are guilty for the offence of murder, punishable under Section
 302, or whether they are criminally liable under the less severe
 Section 304, IPC, several previous judgements of this Court may
 be relied upon.
 Virsa Singh v. State of Punjab [1958] SCR 1495; State
 of Andhra Pradesh v. Rayavarapu Punnayya & Anr.
 [1977] SCR 1 601 and Pulicherla Nagaraju @
 Nagaraja Reddy v. State of Andhra Pradesh (2006) 11
 SCC 444 : [2006] 4 Suppl. SCR 633 – relied on.
 3. The requirement of Section 300 IPC thirdly is fulfilled if
 the prosecution proves that the accused inflicted an injury which
 would been sufficient to have resulted in death of the victim.
 The determinative fact would be the intention to cause such injury
 and what was the degree of probability (gravest, medium, or the
 lowest degree) of death which determines whether the crime is
 culpable homicide or murder.
 4. The case law on the issue of the nature of injury being so
 dangerous as to result in death (Section 300 fourthly), have
 emphasised on the accused’s disregard to the consequences of
 the injury, and an element of callousness to the result, which
 denotes or signifies the intention.
"""


def invoke_analysis(endpoint: str, text: str) -> Dict[str, Any]:
    """Send the provided text to the analysis endpoint."""
    payload = {"text": text}
    response = requests.post(endpoint, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()


def main(argv: Any = None) -> int:
    endpoint = DEFAULT_ENDPOINT
    print(f"▶ Sending analysis request to {endpoint}")
    try:
        payload = invoke_analysis(endpoint, LEGAL_SAMPLE)
    except requests.HTTPError as exc:
        print("✗ Server returned an error:", file=sys.stderr)
        if exc.response is not None:
            print(f"  Status: {exc.response.status_code}", file=sys.stderr)
            try:
                detail = exc.response.json()
            except ValueError:
                detail = exc.response.text
            print(f"  Detail: {detail}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"✗ Failed to reach endpoint: {exc}", file=sys.stderr)
        return 1

    print("✓ Response received:\n")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
