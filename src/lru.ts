export type LRUCache<K, V> = {
	maxSize: number
	map: Map<K, V>
}

export function newLRU(maxSize: number) {
	return {
		map: new Map(),
		maxSize
	}
}

export function addToLRU<K, V>(s: LRUCache<K, V>, key: K, value: V) {
	const size = s.map.size
    if (size == s.maxSize) {
        const leastRecentlyUsed = s.map.keys().next()
        
    }
}

export function getFromLRU() {}
