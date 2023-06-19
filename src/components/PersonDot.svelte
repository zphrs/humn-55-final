<script lang="ts">
    export let username: string
    export let timestamps: [number, number][] = []
    export let currentTimestampRange: [number, number]
    let tweetsIndexedDB = window.indexedDB.open("tweets", 1)
    let db
    let tweetsOnScreen = []
    tweetsIndexedDB.onupgradeneeded = function (event: IndexedDBEvent) {
        db = event.target.result
        let objectStore = db.createObjectStore("tweets", { keyPath: "id" })
        objectStore.createIndex("id", "id", { unique: true })
    }
    tweetsIndexedDB.onsuccess = function (event: IndexedDBEvent) {
        db = event.target.result
        let transaction = db.transaction("tweets", "readonly")
        let objectStore = transaction.objectStore("tweets")
        let request = objectStore.getAll()
        request.onsuccess = function (event) {
            tweetsOnScreen = event.target.result
        }
    }
</script>