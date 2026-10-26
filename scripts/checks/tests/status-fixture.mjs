export const rows = [{ id: 'layer-a', capability: 'Слой A', works_today: 'работает сегодня', not_yet: 'Следующая граница', chapter: 'Глава A' }];
export const statusFiles = { 'src/data/status/layer-map.ru.json': `${JSON.stringify(rows)}\n` };
// These literal expectations are independent of the verifier's DOM builder.
export const row = '<tr data-status-source="book-1.6.1" data-status-row="layer-a"><th scope="row">Слой A</th><td>работает сегодня</td><td>Следующая граница</td><td>Глава A</td></tr>';
export const table = '<table data-status-source="book-1.6.1"><caption>Карта по слоям</caption><thead><tr><th scope="col">Слой и возможность</th><th scope="col">Работает сегодня</th><th scope="col">Чего ещё нет</th><th scope="col">Глава</th></tr></thead><tbody>' + row + '</tbody></table>';
