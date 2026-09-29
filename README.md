# 독도 타임 패트롤: 사라진 기록을 찾아라

기산중학교 독도 사랑 실천대회 1교시에 학생들이 플레이하는 독도 학습 게임입니다.
안드로이드 태블릿의 크롬에서 가로 화면으로, 약 40분 동안 플레이합니다.

- 게임: <https://bon17.github.io/dokdo-love-in-action/>
- 선생님용 랭킹 보드: <https://bon17.github.io/dokdo-love-in-action/ranking.html>
- (두 주소는 GitHub Pages를 켠 뒤에 열립니다.)

## 문서

- [선생님 안내서](docs/teacher-guide.md): GitHub Pages 켜기, 랭킹 설정, 수업 중 비밀번호, 기록 지우기
- [기획서](docs/game-plan.md): 게임 설계 원칙과 단계 구성
- [그림 프롬프트](docs/image-prompts.md): 게임 그림을 만든 프롬프트

## 만들기

`index.html`과 `ranking.html`은 `src/`와 `images/`로 만든 파일입니다. 직접 고치지 말고 아래 명령으로 다시 만드세요.

```sh
pip install pillow qrcode
python3 tools/build.py
```
