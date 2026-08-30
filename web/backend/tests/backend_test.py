"""Backend API tests for 胜利28 FastAPI service."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://winning-panel-v2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


# ---- config / home / user
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()

def test_config(s):
    r = s.get(f"{API}/config")
    assert r.status_code == 200
    assert "title" in r.json()

def test_home(s):
    r = s.get(f"{API}/home")
    assert r.status_code == 200
    j = r.json()
    for k in ("banners", "hotGames", "activities", "news", "hotGoods", "rankings", "gameGroups"):
        assert k in j, f"missing {k}"
    assert len(j["gameGroups"]) >= 1
    assert len(j["rankings"]) == 10
    # new v2 fields
    assert len(j["banners"]) >= 1
    assert "img" in j["banners"][0] and "title" in j["banners"][0]
    assert len(j["hotGames"]) >= 4
    assert "cover" in j["hotGames"][0] and "name" in j["hotGames"][0]
    # goods must carry img now
    assert len(j["hotGoods"]) >= 1
    assert "img" in j["hotGoods"][0] and j["hotGoods"][0]["img"].startswith("http")

def test_user(s):
    r = s.get(f"{API}/user")
    assert r.status_code == 200
    j = r.json()
    assert j["name"] == "jessie"
    assert isinstance(j["messages"], list) and len(j["messages"]) >= 1
    assert isinstance(j["betlog"], list)
    assert isinstance(j["hongbao"], list)


# ---- games
def test_games_groups(s):
    r = s.get(f"{API}/games")
    assert r.status_code == 200
    groups = r.json()["groups"]
    labels = [g["label"] for g in groups]
    # expect the 6 real groups (subset ok)
    for expected in ["急速", "北京", "蛋蛋", "PK", "加拿大", "韩国"]:
        assert expected in labels, f"missing group {expected}. got {labels}"
    # each group has games
    for g in groups:
        assert len(g["games"]) >= 1
        assert "id" in g["games"][0] and "name" in g["games"][0]

def test_game_detail(s):
    r = s.get(f"{API}/games/1")
    assert r.status_code == 200
    j = r.json()
    assert j["gid"] == "1"
    assert "columns" in j and "odds" in j

def test_game_detail_404(s):
    r = s.get(f"{API}/games/99999")
    assert r.status_code == 404


# ---- draws
def test_draws_gid1_page1(s):
    r = s.get(f"{API}/draws", params={"gid": "1", "page": 1, "size": 20})
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 60, f"expected 60 draws (v2 seed), got {j['total']}"
    assert len(j["draws"]) == 20
    d0 = j["draws"][0]
    assert "period" in d0 and "numbers" in d0 and "sum" in d0
    # sorted desc by period
    periods = [d["period"] for d in j["draws"]]
    assert periods == sorted(periods, reverse=True)

def test_draws_gid1_page2(s):
    r = s.get(f"{API}/draws", params={"gid": "1", "page": 2, "size": 20})
    assert r.status_code == 200
    j = r.json()
    assert len(j["draws"]) == 20
    assert j["page"] == 2

def test_draws_empty_for_non_gid1(s):
    # v2: all 26 lottery types now seeded (60 each). gid=999 should be empty.
    r = s.get(f"{API}/draws", params={"gid": "999"})
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 0
    assert j["draws"] == []


@pytest.mark.parametrize("gid", ["1", "8", "15"])  # jisu28, beijing28(keno), pk10
def test_draws_all_lotteries_seeded_v2(s, gid):
    r = s.get(f"{API}/draws", params={"gid": gid, "page": 1, "size": 20})
    assert r.status_code == 200
    j = r.json()
    assert j["total"] == 60, f"gid={gid} expected 60 seeded periods, got {j['total']}"
    assert len(j["draws"]) == 20
    d0 = j["draws"][0]
    assert "period" in d0 and "numbers" in d0 and "sum" in d0
    assert isinstance(d0["numbers"], list) and len(d0["numbers"]) >= 3


# ---- activities / news
def test_activities_list(s):
    r = s.get(f"{API}/activities")
    assert r.status_code == 200
    lst = r.json()["activities"]
    assert len(lst) >= 3
    assert "title" in lst[0] and "content" in lst[0]

def test_activity_detail(s):
    r = s.get(f"{API}/activities/1")
    assert r.status_code == 200
    assert r.json()["id"] == 1

def test_activity_404(s):
    assert s.get(f"{API}/activities/99999").status_code == 404

def test_news_list(s):
    r = s.get(f"{API}/news")
    assert r.status_code == 200
    assert len(r.json()["news"]) >= 3


# ---- rankings
@pytest.mark.parametrize("scope", ["day", "week", "month"])
def test_rankings(s, scope):
    r = s.get(f"{API}/rankings", params={"scope": scope})
    assert r.status_code == 200
    j = r.json()
    assert j["scope"] == scope
    assert len(j["rankings"]) == 20
    assert j["rankings"][0]["rank"] == 1


# ---- shop / partners
def test_shop(s):
    r = s.get(f"{API}/shop")
    assert r.status_code == 200
    j = r.json()
    assert len(j["categories"]) >= 3
    assert len(j["goods"]) >= 10
    assert len(j["hot"]) >= 1
    g = j["goods"][0]
    for k in ("id", "name", "points", "typeid"):
        assert k in g
    # v2: goods must have img
    assert "img" in g and isinstance(g["img"], str) and g["img"].startswith("http")

def test_partners(s):
    r = s.get(f"{API}/partners")
    assert r.status_code == 200
    lst = r.json()["partners"]
    assert len(lst) >= 3
    assert "webname" in lst[0]


# ---- profit stats (v3 tool feature)
@pytest.mark.parametrize("days", [7, 30])
def test_profit_endpoint(s, days):
    r = s.get(f"{API}/profit", params={"days": days})
    assert r.status_code == 200
    j = r.json()
    # summary
    assert "summary" in j
    for k in ("totalBet", "totalWin", "profit", "winRate", "count"):
        assert k in j["summary"], f"missing summary.{k}"
    assert j["summary"]["totalWin"] - j["summary"]["totalBet"] == j["summary"]["profit"]
    # daily
    assert "daily" in j
    assert len(j["daily"]) == days
    d0 = j["daily"][0]
    for k in ("date", "bet", "win", "profit"):
        assert k in d0
    assert d0["win"] - d0["bet"] == d0["profit"]
    # byGame
    assert "byGame" in j and len(j["byGame"]) >= 1
    assert "name" in j["byGame"][0] and "profit" in j["byGame"][0]


def test_profit_deterministic(s):
    """same days input should produce identical response (deterministic demo data)."""
    a = s.get(f"{API}/profit", params={"days": 7}).json()
    b = s.get(f"{API}/profit", params={"days": 7}).json()
    assert a == b


def test_profit_days_differ(s):
    a = s.get(f"{API}/profit", params={"days": 7}).json()
    b = s.get(f"{API}/profit", params={"days": 30}).json()
    assert len(a["daily"]) != len(b["daily"])

