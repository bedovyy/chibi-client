export default class History {
  constructor() {
    this.db = null;
  }

  // 1. IndexedDB 열기 또는 생성
  static open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('history', 1);

      // 버전 변경 시 실행 (첫 생성 시 또는 DB 버전이 업데이트 될 때)
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('historyStore')) {
          const store = db.createObjectStore('historyStore', { autoIncrement: true });
          store.createIndex('urlIndex', 'url', { unique: false });
        }
      };

      // 성공적으로 열린 경우
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      // 오류가 발생한 경우
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 2. URL과 정보를 받아서 데이터 저장
  static push(url, info) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('DB가 열리지 않았습니다. 먼저 History.open()을 호출해야 합니다.');
      }

      const transaction = this.db.transaction(['historyStore'], 'readwrite');
      const store = transaction.objectStore('historyStore');

      const historyData = { url, info, timestamp: new Date().toISOString() };
      const request = store.add(historyData);

      request.onsuccess = () => {
        resolve('데이터가 저장되었습니다.');
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 3. 모든 저장된 history 데이터를 불러오기
  static getAll() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('DB가 열리지 않았습니다. 먼저 History.open()을 호출해야 합니다.');
      }

      const transaction = this.db.transaction(['historyStore'], 'readonly');
      const store = transaction.objectStore('historyStore');
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 4. 특정 URL에 해당하는 데이터를 조회
  static getByUrl(url) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('DB가 열리지 않았습니다. 먼저 History.open()을 호출해야 합니다.');
      }

      const transaction = this.db.transaction(['historyStore'], 'readonly');
      const store = transaction.objectStore('historyStore');
      const index = store.index('urlIndex');
      const request = index.getAll(url);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 5. 모든 데이터 삭제
  static clearAll() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('DB가 열리지 않았습니다. 먼저 History.open()을 호출해야 합니다.');
      }

      const transaction = this.db.transaction(['historyStore'], 'readwrite');
      const store = transaction.objectStore('historyStore');
      const request = store.clear();

      request.onsuccess = () => {
        resolve('모든 데이터가 삭제되었습니다.');
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // 6. 특정 데이터 삭제 (URL을 기준으로)
  static deleteByUrl(url) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('DB가 열리지 않았습니다. 먼저 History.open()을 호출해야 합니다.');
      }

      const transaction = this.db.transaction(['historyStore'], 'readwrite');
      const store = transaction.objectStore('historyStore');
      const index = store.index('urlIndex');
      const request = index.getAll(url);

      request.onsuccess = (event) => {
        const results = event.target.result;
        results.forEach(item => {
          store.delete(item.id);  // 각 항목의 id를 이용해 삭제
        });
        resolve('해당 URL의 모든 데이터가 삭제되었습니다.');
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}

