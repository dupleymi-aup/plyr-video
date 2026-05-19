## Qwen Added Memories
- Проект plyr-video: форк Plyr v3.8.4 с добавлением российских видеохостингов (Rutube, Yandex, VK, Mail.ru, MTS Link).
- Ветки: dev и main. Сборка: gulp build. Линтинг: eslint + stylelint + remark.
- Тесты: 27 тестовых файлов, 378 тестов (Vitest 3 с jsdom, покрытие через v8).
- Веб-приложение: Next.js 16 в директории web/ (TypeScript, Prisma, NextAuth, Tailwind).
- Последние улучшения: исправлены пустые .catch обработчики, XSS-уязвимости (innerHTML → textContent), безопастная stripHTML, улучшен generateId (crypto.randomUUID), arrow function класс-методы → prototype методы для экономии памяти.
- todo.md содержит план работ.
