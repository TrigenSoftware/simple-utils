import { spawn } from 'child_process'
import { Readable } from 'stream'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  toArray,
  mergeReadables,
  splitStream,
  firstFromStream
} from './index.js'

function stream(id: string, time: number) {
  // eslint-disable-next-line no-template-curly-in-string, prefer-template
  const child = spawn('node', ['-e', '(async () => { for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, ' + time + ')); console.log(`' + id + '${i}`) }})()'])

  return child.stdout
}

describe('stream-utils', () => {
  describe('mergeReadables', () => {
    it('should merge multiple readable streams', async () => {
      const stream1 = stream('a', 10)
      const stream2 = stream('b', 25)
      const merged = mergeReadables({
        a: stream1,
        b: stream2
      })
      const result = await toArray(merged)

      expect(result).toHaveLength(20)
    })
  })

  describe('splitStream', () => {
    it('should split strings stream by separator', async () => {
      const stream = Readable.from([
        '1 2',
        ' 3',
        ' 4 5 6'
      ])
      const result = await toArray(splitStream(stream, ' '))

      expect(result).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6'
      ])
    })
  })

  describe('firstFromStream', () => {
    it('should return the first element', async () => {
      const stream = Readable.from([
        '1 2',
        ' 3',
        ' 4 5 6'
      ])
      const result = await firstFromStream(stream)

      expect(result).toEqual('1 2')
    })

    it('should return null if the stream is empty', async () => {
      const stream = Readable.from([])
      const result = await firstFromStream(stream)

      expect(result).toEqual(null)
    })
  })
})
