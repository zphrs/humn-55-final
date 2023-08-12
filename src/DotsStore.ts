import {
	db as dbStore,
	getTweetsInRange,
	saturateUserProfile,
	type SaturatedUserProfile,
	type Tweet,
	type TimestampRange,
	type UserProfile
} from './TweetsStore'
import { readable, type Readable } from 'svelte/store'

const usersDict: { [user: string]: Readable<SaturatedUserProfile | undefined> } = {}
let db: IDBDatabase | undefined = undefined
dbStore.subscribe((dbValue) => {
	console.log('db changed')
	db = dbValue
})

export function getTweetsStore(
	db: IDBDatabase,
	user: UserProfile,
	range: TimestampRange,
	signal: AbortSignal
) {
	return readable<SaturatedUserProfile | undefined>(undefined, (set) => {
		saturateUserProfile(db, user, range, signal).then((res) => {
			set(res)
		})
	})
}
