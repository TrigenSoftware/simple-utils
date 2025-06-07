import type { ChildProcess } from 'child_process'
import { concatBufferStream } from '@simple-libs/stream-utils'

/**
 * Wait for a child process to exit and return its exit code.
 * @param process
 * @returns A promise that resolves to the exit code of the process.
 */
export async function exitCode(process: ChildProcess) {
  if (process.exitCode !== null) {
    return process.exitCode
  }

  return new Promise<number>(resolve => process.once('close', resolve))
}

/**
 * Catch error from a child process.
 * Also captures stderr output.
 * @param process
 * @returns A promise that resolves to an Error if the process exited with a non-zero code, or null if it exited successfully.
 */
export async function catchProcessError(process: ChildProcess) {
  let error = new Error('Process exited with non-zero code')
  let stderr = ''

  process.on('error', (err: Error) => {
    error = err
  })

  if (process.stderr) {
    let chunk: Buffer

    for await (chunk of process.stderr) {
      stderr += chunk.toString()
    }
  }

  const code = await exitCode(process)

  if (stderr) {
    error = new Error(stderr)
  }

  return code ? error : null
}

/**
 * Throws an error if the child process exits with a non-zero code.
 * @param process
 */
export async function throwProcessError(process: ChildProcess) {
  const error = await catchProcessError(process)

  if (error) {
    throw error
  }
}

/**
 * Yields the stdout of a child process.
 * It will throw an error if the process exits with a non-zero code.
 * @param process
 * @yields The stdout of the process.
 */
export async function* outputStream(process: ChildProcess) {
  const error = throwProcessError(process)

  if (process.stdout) {
    yield* process.stdout as AsyncIterable<Buffer>
  }

  await error
}

/**
 * Collects the stdout of a child process into a single Buffer.
 * It will throw an error if the process exits with a non-zero code.
 * @param process
 * @returns A promise that resolves to a Buffer containing the stdout of the process.
 */
export function output(process: ChildProcess) {
  return concatBufferStream(outputStream(process))
}
