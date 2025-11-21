<!-- 1. vscode liveserver로 실행. -->
2. http-server -S -C ~/.ssl/cert.pem -K ~/.ssl/key.pem -a 0.0.0.0 -p 8080
3. ipconfig getifaddr en0   이 명령어로 ip PC의 ip 주소 확인
4. appwrite에 platform 추가 -> ip 호스트 입력 (javascript)
5. https://[IP주소]:8080 접속


----
(맥으로만 wifi 접속할 때, 아이패드와 USB로 연결 후 할 것.)
* 맥으로 wifi 접속 -> 맥과 ipad 연결 -> 맥에서 인터넷 공유 설정
(다음으로부터 연결 공유: wifi | 다음을 사용하는 기기 대상 : ipad USB)
-> ipad wifi 해제 -> safari로 접속 도구 막대 가리기 
이때, 인증서 문제 있으면 chrome으로 한 번 접속 후 새로고침
