module.exports = [
  {
    id: 'Ent1',
    create: data => {
      // async call here to create data
      // return the payload to be stored locally
    },
    items: [
      {
        id: '1'
      }
    ]
  },
  {
    id: 'Ent2',
    create: data => {

    },
    items: [
      {
        id: '1',
        ent1: { $type: 'Ent1', $item: '1' }
      }
    ]
  }
]
