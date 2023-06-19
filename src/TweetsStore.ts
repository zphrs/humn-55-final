import { readable, type Readable } from 'svelte/store'
import { base } from '$app/paths'
import type { Rect } from '$lib/PannableCanvas/sizes'
import { browser } from '$app/environment'
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
	randomPosY: number
}

export type SaturatedUserProfile = UserProfile & {
	tweets: Tweet[]
	timestampRange: TimestampRange
}

export type Tweet = {
	id: string
	date: Date
	rawContent: string
	media: null | ({ thumbnailUrl: string; variants: string[] } | string)[]
	username: '000e151_'
	containsBlackLivesMatter: boolean
	containsBlueLivesMatter: boolean
	containsMeToo: boolean
	containsClimate: boolean
	rollingTweetsPerMonth: number
	sumOfBlackLivesMatter: number
	sumOfBlueLivesMatter: number
	sumOfMeToo: number
	sumOfClimate: number
	rollingSumOfBlackLivesMatter: number
	rollingSumOfBlueLivesMatter: number
	rollingSumOfMeToo: number
	rollingSumOfClimate: number
}

export function parseTweet(tweet: Tweet) {
	tweet.date = new Date(tweet.date)
	return tweet
}

export async function saturateUserProfile(
	db: IDBDatabase,
	userProfile: UserProfile,
	timestampRange: TimestampRange
): Promise<SaturatedUserProfile> {
	const tweets = await getTweetsInRange(db, userProfile, timestampRange)
	return { ...userProfile, tweets, timestampRange }
}

export async function getTweetsInRange(
	db: IDBDatabase,
	userProfile: UserProfile,
	timestampRange: TimestampRange
): Promise<Tweet[]> {
	const [start, end] = timestampRange
	// try to get tweets from the db
	const tweets = await getTweetsFromDb(db, userProfile.user, start, end)
	if (tweets) return tweets

	const dbUpToDatePromises = []
	for (const timestamps of userProfile.activeDateRanges) {
		const [tsStart, tsEnd] = timestamps
		if (tsEnd < start) continue
		if (tsStart > end) continue
		const tweets = await getTweetsFromApi(userProfile.user, tsStart)
		if (!tweets) continue
		// add tweets to db
		const tweetStore = db.transaction('tweets', 'readwrite').objectStore('tweets')
		dbUpToDatePromises.push(Promise.all(tweets.map((tweet) => wrapRequest(tweetStore.add(tweet)))))
	}
	await Promise.all(dbUpToDatePromises)

	const tweets2 = await getTweetsFromDb(db, userProfile.user, start, end)
	if (!tweets2) throw new Error('tweets2 is undefined unexpectedly')
	return tweets2
}

export async function getTweetsFromApi(user: string, start: Date): Promise<Tweet[] | undefined> {
	// ex: /data/users/000e151_/1616466969.json
	// convert to seconds
	const startSeconds = Math.floor(start.getTime() / 1000)
	const url = `${base}/data/users/${user}/${startSeconds}.json`
	const res = await fetch(url)
	if (!res.ok) return undefined
	const tweets = await res.json()

	return tweets.map(parseTweet)
}

export async function getTweetsFromDb(
	db: IDBDatabase,
	user: string,
	start: Date,
	end: Date
): Promise<Tweet[] | undefined> {
	const tweetStore = db.transaction('tweets').objectStore('tweets')
	try {
		const tweets = await wrapRequest(
			tweetStore.index('username_date').getAll(IDBKeyRange.bound([user, start], [user, end]))
		)
		return tweets.length > 0 ? (tweets as Tweet[]) : undefined
	} catch (e) {
		console.error(e)
		return undefined
	}
}

export const db: Readable<IDBDatabase | undefined> = readable(undefined, (set) => {
	if (!browser) return
	const request = indexedDB.open('tweets', 2)
	request.onupgradeneeded = async () => {
		const db = request.result

		// clear the db
		for (const name of db.objectStoreNames) {
			db.deleteObjectStore(name)
		}

		const tweetStore = db.createObjectStore('tweets', { keyPath: 'id' })
		tweetStore.createIndex('id', 'id', { unique: true })
		tweetStore.createIndex('date', 'date', { unique: false })
		tweetStore.createIndex('username', 'username', { unique: false })
		tweetStore.createIndex('username_date', ['username', 'date'], { unique: false })

		tweetStore.createIndex('containsBlackLivesMatter', 'containsBlackLivesMatter', {
			unique: false
		})
		tweetStore.createIndex('containsBlueLivesMatter', 'containsBlueLivesMatter', { unique: false })
		tweetStore.createIndex('containsMeToo', 'containsMeToo', { unique: false })
		tweetStore.createIndex('containsClimate', 'containsClimate', { unique: false })

		const userStore = db.createObjectStore('users', { keyPath: 'user' })
		userStore.createIndex('username', 'user', { unique: true })
		userStore.createIndex('randomPos', 'randomPos', { unique: false })
		// add index for [1] of randomPos
		userStore.createIndex('randomPosY', 'randomPosY', { unique: false })
		// fetch activeDateRanges.json and put it in the db
		const activeDateRanges: { [username: string]: UserProfile } = await fetch(
			`${base}/data/activeDateRanges.json`
		).then((res) => res.json())
		const newTransaction = db.transaction(['users'], 'readwrite')
		const objectStore = newTransaction.objectStore('users')
		// store the activeDateRanges in the userStore
		for (const username of Object.keys(activeDateRanges)) {
			activeDateRanges[username].randomPosY = activeDateRanges[username].randomPos[1]
			objectStore.put(activeDateRanges[username])
		}
		set(db as any)
	}
	request.onsuccess = async (e: any) => {
		const db: IDBDatabase = e.target.result
		// const activeDateRanges: { [username: string]: UserProfile } = await fetch(
		// 	`${base}/data/activeDateRanges.json`
		// ).then((res) => res.json())
		// console.log(activeDateRanges)
		// const userStore = db.transaction(['users'], 'readwrite').objectStore('users')
		// // store the activeDateRanges in the userStore
		// for (const username of Object.keys(activeDateRanges)) {
		// 	userStore.put(activeDateRanges[username])
		// }
		set(db as any)
	}
})

async function wrapRequest<T>(request: IDBRequest<T>) {
	return new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function getUsersFromRect(db: IDBDatabase, rect: Rect) {
	// get all users that have randomPos in the rect by using the randomPos index
	const users = await new Promise<UserProfile[]>(async (resolve) => {
		const transaction = db.transaction(['users'], 'readonly')
		const store = transaction.objectStore('users')
		const index = store.index('randomPos')
		const range = IDBKeyRange.bound([rect.x, rect.y], [rect.x + rect.width, rect.y + rect.height])
		// get how many users are in the rect
		const xCountRequest = index.count(range)

		const yIndex = store.index('randomPosY')
		const yRange = IDBKeyRange.bound(rect.y, rect.y + rect.height)
		const yCountRequest = yIndex.count(yRange)
		// find the min of the two
		const [xCount, yCount] = await Promise.all([
			wrapRequest(xCountRequest),
			wrapRequest(yCountRequest)
		])
		// get using the index which is smaller
		const indexToUse = xCount < yCount ? index : yIndex
		const rangeToUse = xCount < yCount ? range : yRange
		const request = indexToUse.getAll(rangeToUse)
		request.onsuccess = () => {
			// verify that the users are in the rect
			const users: UserProfile[] = request.result.filter((user) => {
				const [x, y] = user.randomPos
				return rect.contains({ x, y })
			})
			resolve(users)
		}
		request.onerror = () => {
			console.error(request.error)
			resolve([])
		}
	})
	return users
}
