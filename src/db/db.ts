import Dexie, { type Table } from 'dexie'
import type {
  Delivery,
  FieldSetup,
  Ground,
  Innings,
  Match,
  Player,
  ShotEvent,
  Team,
} from '../domain'

export class JistDB extends Dexie {
  matches!: Table<Match, string>
  teams!: Table<Team, string>
  players!: Table<Player, string>
  innings!: Table<Innings, string>
  deliveries!: Table<Delivery, string>
  shotEvents!: Table<ShotEvent, string>
  grounds!: Table<Ground, string>
  fieldSetups!: Table<FieldSetup, string>

  constructor() {
    super('jist')
    this.version(1).stores({
      matches: 'id, status, groundId, teamAId, teamBId, createdAt',
      teams: 'id, name',
      players: 'id, teamId',
      innings: 'id, matchId, [matchId+innings]',
      deliveries: 'id, matchId, [matchId+innings], shotEventId',
      shotEvents: 'id, matchId, [matchId+innings], zoneId',
      grounds: 'id, name, venueId',
      fieldSetups: 'matchId, [matchId+innings]',
    })
  }
}

export const db = new JistDB()