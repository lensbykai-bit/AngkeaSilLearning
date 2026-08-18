# Angkea Sil Learning — Theme v1.4 Learning Hub

Changes:
1. Larger and stronger Logo/Brand.
2. Home stays unchanged.
3. Clicking "មេរៀនថ្មីៗ" opens a premium "វគ្គសិក្សាពេញនិយម" popup.
4. Clicking "សៀវភៅ" opens a "ឆាប់ៗនេះ" popup.
5. "មេរៀនទិញ" opens `my-courses.html`.
6. About unchanged.
7. Contact unchanged.
8. Search unchanged.
9. Cart unchanged.
10. Login / Sign up unchanged.

Payment behavior:
- When PayWay Check Transaction returns APPROVED, the purchased course ID is saved to browser localStorage.
- The purchased course appears in `my-courses.html`.
- The learner can open `course-view.html`.

Important:
This v1.4 access persistence is browser-local only. For secure permanent access across devices/accounts,
connect authentication + a database/backend entitlement system in a later version.

Never upload `.env`, API keys, PINs, passwords, or other secret credentials to GitHub.
