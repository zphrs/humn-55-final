import { readable, type Readable } from 'svelte/store'
export type TimestampRange = [Date, Date]
export type UserProfile = {
	activeDateRanges: TimestampRange[]
	user: '000e151_'
	rangeStats: {
		userAffiliation: {
			percentBlackLivesMatter: 1.0
			percentBlueLivesMatter: 0.0
			percentMeToo: 0.0
			percentClimate: 0.0
			user: '000e151_'
		}
	}
	/** numbers are between 0 and 1 */
	randomPos: [number, number]
}

export type Tweet = {
	id: 1374188188512645121n
	date: 1616466969000
	rawContent: '#BlackLivesMatter #BlackLivesMatter         https://t.co/zAMiWlWyNF'
	userId: 1260417643686670336
	media: null
	username: '000e151_'
	containsBlackLivesMatter: true
	containsBlueLivesMatter: false
	containsMeToo: false
	containsClimate: false
	rollingTweetsPerMonth: 1.0
	sumOfBlackLivesMatter: 1
	sumOfBlueLivesMatter: 0
	sumOfMeToo: 0
	sumOfClimate: 0
	rollingSumOfBlackLivesMatter: 1.0
	rollingSumOfBlueLivesMatter: 0.0
	rollingSumOfMeToo: 0.0
	rollingSumOfClimate: 0.0
}

export const db: Readable<IDBDatabase | undefined> = readable(undefined, (set) => {
	const request = indexedDB.open('tweets', 1)
	request.onupgradeneeded = () => {
		const db = request.result
		const tweetStore = db.createObjectStore('tweets', { keyPath: 'id' })
		tweetStore.createIndex('id', 'id', { unique: true })
		const userStore = db.createObjectStore('username', { keyPath: 'username' })
	}
	request.onsuccess = (e: any) => {
		set(e.target.result)
	}
})
