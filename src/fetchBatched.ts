import { sleep } from '$lib/Utils/sleep'
import { parseTweet, type Tweet } from './TweetsStore'
type QueueItem = {
	url: string
	signal: AbortSignal
	resolve: (value: Tweets | undefined) => void
}
let queue: QueueItem[] = []

type Tweets = Tweet[]

let currentlyFetching = false

export async function fetch_batched(url: string, signal: AbortSignal): Promise<Tweets | undefined> {
	return await new Promise((resolve) => {
		queue.push({
			url,
			signal,
			resolve
		})
		if (!currentlyFetching) {
			loop()
		}
	})
}
async function asEachResolves<T>(values: Promise<T>[], onResolve: (item: T) => void): Promise<T[]> {
	const results = await Promise.all(values)
	values.forEach(async (item) => onResolve(await item))
	return results
}
async function loop() {
	currentlyFetching = true
	async function onResolve() {
		if (queue.length == 0) {
			currentlyFetching = false
			return
		}
		let rand = Math.random()
		let timeout = rand * rand
		await sleep(timeout / 100)
		fetch_tweets(queue.shift()!).then(onResolve)
	}
	const batch = queue.splice(0, 20)
	asEachResolves(
		batch.map((req) => fetch_tweets(req)),
		onResolve
	)
}

async function fetch_tweets(item: QueueItem) {
	const { url, signal, resolve } = item
	try {
		const res = await fetch(url, { signal })
		if (!res.ok) {
			console.error(`fetch failed: ${res.status} ${res.statusText}`)
			resolve(undefined)
			return
		}
		const tweets = await res.json()
		resolve(tweets.map(parseTweet))
	} catch (e) {
		if (item.signal.aborted) return
		console.error(e)
		setTimeout(() => fetch_tweets(item), 0)
	}
}
