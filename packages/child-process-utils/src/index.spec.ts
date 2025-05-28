import { spawn } from 'child_process'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  exitCode,
  catchProcessError,
  outputStream,
  output
} from './index.js'

function child(code: string) {
  return spawn('node', ['-e', code])
}

describe('child-process-utils', () => {
  describe('exitCode', () => {
    it('should return the exit code of a child process', async () => {
      const childProcess = child('process.exit(0)')
      const code = await exitCode(childProcess)

      expect(code).toBe(0)
    })

    it('should return the exit code of a child process with an error', async () => {
      const childProcess = child('process.exit(1)')
      const code = await exitCode(childProcess)

      expect(code).toBe(1)
    })
  })

  describe('catchProcessError', () => {
    it('should catch an error from a child process', async () => {
      const childProcess = child('throw new Error("Test error")')
      const error = await catchProcessError(childProcess)

      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toContain('Test error')
    })

    it('should return null if the process exits successfully', async () => {
      const childProcess = child('process.exit(0)')
      const error = await catchProcessError(childProcess)

      expect(error).toBeNull()
    })
  })

  describe('outputStream', () => {
    it('should yield the stdout of a child process', async () => {
      const childProcess = child(`
        (async () => {
          for (let i = 0; i < 5; i++) {
            console.log('line ' + i)
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        })()
      `)
      const output = outputStream(childProcess)
      const result: string[] = []

      for await (const line of output) {
        result.push(line.toString())
      }

      expect(result).toHaveLength(5)
      expect(result[0]).toBe('line 0\n')
    })

    it('should throw an error if the process exits with a non-zero code', async () => {
      const childProcess = child('process.exit(1)')

      await expect(async () => {
        for await (const _ of outputStream(childProcess)) {
          void _
        }
      }).rejects.toThrow('Process exited with non-zero code')
    })
  })

  describe('output', () => {
    it('should return the stdout of a child process as a string', async () => {
      const childProcess = child(`
        (async () => {
          for (let i = 0; i < 3; i++) {
            console.log('output ' + i)
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        })()
      `)
      const result = await output(childProcess)

      expect(result.toString()).toBe('output 0\noutput 1\noutput 2\n')
    })

    it('should throw an error if the process exits with a non-zero code', async () => {
      const childProcess = child('process.exit(1)')

      await expect(output(childProcess)).rejects.toThrow('Process exited with non-zero code')
    })
  })
})
