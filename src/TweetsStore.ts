import { readable, type Readable } from 'svelte/store'
import { base } from '$app/paths'
import type { Rect } from '$lib/PannableCanvas/sizes'
import { browser } from '$app/environment'
import { fetch_batched } from './fetchBatched'
export type TimestampRange = [number, number]
export type UserProfile = {
	activeDateRanges: TimestampRange[]
	cachedDateRanges: number[]
	user: string
	rangeStats: {
		userAffiliation: {
			percentBlackLivesMatter: 1.0
			percentBlueLivesMatter: 0.0
			percentMeToo: 0.0
			percentClimate: 0.0
		}
	}
	/** numbers are between 0 and 1 */
	randomPos: [number, number]
	randomPosX: number
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
	username: string
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
	timestampRange: TimestampRange,
	signal: AbortSignal
): Promise<SaturatedUserProfile> {
	const tweets = await getTweetsInRange(db, userProfile, timestampRange, signal)
	return { ...userProfile, tweets, timestampRange }
}

export async function getTweetsInRange(
	db: IDBDatabase,
	userProfile: UserProfile,
	timestampRange: TimestampRange,
	signal: AbortSignal
): Promise<Tweet[]> {
	const [start, end] = timestampRange.map((e) => new Date(e * 1000))

	const dbUpToDatePromises = []
	for (const timestamps of userProfile.activeDateRanges) {
		const [tsStart, tsEnd] = timestamps
		if (tsStart > end.getTime() / 1000) continue
		if (tsEnd < start.getTime() / 1000) continue
		if (userProfile.cachedDateRanges.includes(tsStart)) {
			console.log('already loaded in')
			continue
		}
		const tweets = await getTweetsFromApi(userProfile.user, new Date(tsStart * 1000), signal)
		markTweetJSONAsFetched(db, userProfile, tsStart)
		if (!tweets) continue
		// add tweets to db
		const tweetStore = db.transaction('tweets', 'readwrite').objectStore('tweets')
		dbUpToDatePromises.push(Promise.all(tweets.map((tweet) => wrapRequest(tweetStore.put(tweet)))))
	}
	await Promise.all(dbUpToDatePromises)
	// await new Promise((resolve) => {
	// 	setTimeout(resolve, 1000)
	// })

	const tweets = await getTweetsFromDb(db, userProfile.user, start, end)
	if (tweets === undefined) throw new Error('tweets2 is undefined unexpectedly')
	return tweets
}

export async function getTweetsFromApi(
	user: string,
	start: Date,
	signal: AbortSignal
): Promise<Tweet[] | undefined> {
	// ex: /data/users/000e151_/1616466969.json
	// convert to seconds
	const startSeconds = Math.floor(start.getTime() / 1000)
	const url = `${base}/data/users/${user}/${startSeconds}.json`
	const tweets = await fetch_batched(url, signal)
	return tweets
}

const batched_fetches = new Set()

const interval: number | undefined = undefined

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
		return tweets !== undefined ? (tweets as Tweet[]) : undefined
	} catch (e) {
		console.error(e)
		return undefined
	}
}

export const db: Readable<IDBDatabase | undefined> = readable(undefined, (set) => {
	if (!browser) return
	const request = indexedDB.open('tweets', 10)
	request.onupgradeneeded = async (event: any) => {
		console.log('HERE')
		const db = request.result
		const transaction = event.target.transaction

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
		userStore.createIndex('randomPosX', 'randomPosX', { unique: false })
		// add index for [1] of randomPos
		userStore.createIndex('randomPosY', 'randomPosY', { unique: false })
		transaction.oncomplete = async () => {
			console.log('transaction complete')
			await fillDB(db)
			set(db as any)
		}
	}
	request.onsuccess = async (e: any) => {
		const db: IDBDatabase = e.target.result
		set(db as any)
	}
})

async function fillDB(db: IDBDatabase) {
	const activeDateRanges: { [username: string]: UserProfile } = await fetch(
		`${base}/data/activeDateRanges.json`
	).then((res) => res.json())
	console.log('fetched')
	const newTransaction = db.transaction(['users'], 'readwrite')
	const objectStore = newTransaction.objectStore('users')
	// store the activeDateRanges in the userStore
	for (const username of Object.keys(activeDateRanges)) {
		activeDateRanges[username].randomPosX = activeDateRanges[username].randomPos[0]
		activeDateRanges[username].randomPosY = activeDateRanges[username].randomPos[1]
		activeDateRanges[username].activeDateRanges = activeDateRanges[username].activeDateRanges.map(
			(e) => e.map((ts: number) => Number.parseInt(ts as unknown as string)) as TimestampRange
		)
		activeDateRanges[username].cachedDateRanges = []
		objectStore.put(activeDateRanges[username])
	}
}

async function wrapRequest<T>(request: IDBRequest<T>) {
	return new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

async function markTweetJSONAsFetched(db: IDBDatabase, user: UserProfile, timestamp: number) {
	user.cachedDateRanges.push(timestamp)
	// put to users object store the updated user
	const userStore = db.transaction(['users'], 'readwrite').objectStore('users')
	await wrapRequest(userStore.put(user))
}

export async function getUsersFromRect(db: IDBDatabase, rect: Rect) {
	// get all users that have randomPos in the rect by using the randomPos index
	const users = await new Promise<UserProfile[]>(async (resolve) => {
		const transaction = db.transaction(['users'], 'readonly')
		const store = transaction.objectStore('users')
		const xIndex = store.index('randomPosX')
		const xRange = IDBKeyRange.bound(rect.x, rect.x + rect.width)
		// get how many users are in the rect
		const xCountRequest = xIndex.count(xRange)

		const yIndex = store.index('randomPosY')
		const yRange = IDBKeyRange.bound(rect.y, rect.y + rect.height)
		const yCountRequest = yIndex.count(yRange)
		// find the min of the two
		const [xCount, yCount] = await Promise.all([
			wrapRequest(xCountRequest),
			wrapRequest(yCountRequest)
		])
		// get using the index which is smaller
		const indexToUse = xCount < yCount ? xIndex : yIndex
		const rangeToUse = xCount < yCount ? xRange : yRange
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
