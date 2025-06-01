import { Readable } from 'stream'

/**
 * Get all items from an async iterable and return them as an array.
 * @param iterable
 * @returns A promise that resolves to an array of items.
 */
export async function toArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = []

  for await (const item of iterable) {
    result.push(item)
  }

  return result
}

/**
 * Concatenate all buffers from an async iterable into a single Buffer.
 * @param iterable
 * @returns A promise that resolves to a single Buffer containing all concatenated buffers.
 */
export async function concatBufferStream(iterable: AsyncIterable<Buffer>) {
  return Buffer.concat(await toArray(iterable))
}

/**
 * Concatenate all strings from an async iterable into a single string.
 * @param iterable
 * @returns A promise that resolves to a single string containing all concatenated strings.
 */
export async function concatStringStream(iterable: AsyncIterable<string>) {
  return (await toArray(iterable)).join('')
}

/**
 * Get the first item from an async iterable.
 * @param stream
 * @returns A promise that resolves to the first item, or null if the iterable is empty.
 */
export async function firstFromStream<T>(stream: AsyncIterable<T>) {
  for await (const tag of stream) {
    return tag
  }

  return null
}

export interface MergedReadableChunk<K extends string, T = Buffer> {
  source: K
  chunk: T
}

/**
 * Merges multiple Readable streams into a single Readable stream.
 * Each chunk will be an object containing the source stream name and the chunk data.
 * @param streams - An object where keys are stream names and values are Readable streams.
 * @returns A merged Readable stream.
 */
export function mergeReadables<
  K extends string,
  T = Buffer
>(
  streams: Record<K, Readable>
): Readable & AsyncIterable<MergedReadableChunk<K, T>> {
  const mergedStream = new Readable({
    objectMode: true,
    read() {
      /* no-op */
    }
  })
  let ended = 0

  Object.entries(streams as Record<string, Readable>).forEach(([name, stream], _i, entries) => {
    stream
      .on('data', (chunk: Buffer) => mergedStream.push({
        source: name,
        chunk
      }))
      .on('end', () => {
        ended += 1

        if (ended === entries.length) {
          mergedStream.push(null)
        }
      })
      .on('error', err => mergedStream.destroy(err))
  })

  return mergedStream
}

/**
 * Split stream by separator.
 * @param stream
 * @param separator
 * @yields String chunks.
 */
export async function* splitStream(stream: AsyncIterable<string | Buffer>, separator: string) {
  let chunk: string | Buffer
  let payload: string[]
  let buffer = ''

  for await (chunk of stream) {
    buffer += chunk.toString()

    if (buffer.includes(separator)) {
      payload = buffer.split(separator)
      buffer = payload.pop() || ''

      yield* payload
    }
  }

  if (buffer) {
    yield buffer
  }
}
