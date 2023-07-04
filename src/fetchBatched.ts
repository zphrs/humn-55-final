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
			currentlyFetching = true
			loop()
		}
	})
}

async function batch_requests(count: number) {
	const batch = queue.splice(0, count).filter((item) => !item.signal.aborted)
	await Promise.all(batch.map((req) => fetch_tweets(req)))
}
async function loop() {
	while (true) {
		console.log('looping')
		await batch_requests(50)
		if (queue.length == 0) break
	}
	currentlyFetching = false
}

async function fetch_tweets(item: QueueItem) {
	const { url, signal, resolve } = item
	const res = await fetch(url, { signal })
	if (!res.ok) {
		console.error(`fetch failed: ${res.status} ${res.statusText}`)
		resolve(undefined)
		return
	}
	const tweets = await res.json()
	resolve(tweets.map(parseTweet))
}
