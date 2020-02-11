const request = require('superagent')
const fs = require('fs').promises
const _ = require('lodash')

const Throttle    = require('superagent-throttle')

const throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 2,          // how many requests can be sent every `ratePer`
  ratePer: 1000,   // number of ms in which `rate` requests may be sent
  concurrent: 1     // how many requests can be sent concurrently
})

const wg = async (resource, params) => {
	const query = {
		'application_id':'0232ba1c627c5b6f2410298b7e37f75a',
		'r_realm':'na',
		...params
	}

	const res = await request
		.get(`https://api.worldoftanks.com/wot/${resource}`)
		.query(query)
		.use(throttle.plugin())
		.type('json')
	return res.body
}

const updateTanks = async () => {
	const tanks = await wg('encyclopedia/vehicles/', {tier:'10',fields:'short_name'})
	return fs.writeFile('./tanks.json',JSON.stringify(tanks.data))
}

const getPlayerTanks = async (id, params) => {
	const pTanks = await wg('tanks/stats/', {account_id:id, fields: 'tank_id,all.battles', ...params})
	const allBattles = {}
	pTanks.data[id].forEach(rec => {
		allBattles[rec.tank_id] = rec.all.battles
	})
	return allBattles
}

const meta = [
	'Obj. 907',
	'Obj. 279 (e)',
	'T95/FV4201',
	'Obj. 260',
	'EBR 105',
	'Maus',
	'Obj. 268 4',
	'Obj. 140', 
	'Strv 103B',
	'ConquerorGC',
	'Obj. 277',
	'WZ-111 5A',
	'S. Conqueror',
	'T-100 LT',
	'TVP T 50/51',
	'B-C 25 t',
	'IS-7',
	'Kranvagn',
	'STB-1',
	'Leopard 1',
	'T57 Heavy',
	'AMX 50 B'
]
const tanks = require('./tanks.json')
const metaIds = []
const titles = ['Player']
meta.forEach( name => {
	const id = _.findKey(tanks, tank => tank.short_name === name)
	if(!id) {
		throw `Could not find ${name}`
	}
	metaIds.push(id)
	titles.push(name)
})
const metaIdList = metaIds.join(',')

const createRow = async (player) => {
	const pTanks = await getPlayerTanks(player.account_id, {tank_id:metaIdList})
	const rec = [player.account_name]
	metaIds.forEach(id => {
		rec.push(pTanks[id] || 0)
	})
	return rec.join(',')

}

const main = async () => {
	//const clan = await wg('clans/info/', {clan_id:'1000050973'})
	//await updateTanks()
	const clan = require('./nuffs.json')


	
	console.log(titles.join(','))
	clan.data['1000050973'].members.forEach(async player => {
		const row = await createRow(player)
		console.log(row)
	})


}

main()
