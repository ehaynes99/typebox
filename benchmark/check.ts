import { Cases } from './cases'
import { Benchmark } from './benchmark'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { TypeGuard } from 'src/guard/guard'
import { Value } from '@sinclair/typebox/value'
import { TSchema } from '@sinclair/typebox'
import Ajv from 'ajv'

const ajv = new Ajv() // ensure single instance

export type Result = {
  type: string
  ajv: {
    iterations: number
    completed: number
  }
  typebox: {
    iterations: number
    completed: number
  }
}

export namespace CheckBenchmark {
  function Measure<T extends TSchema>(type: string, schema: T) {
    console.log('CheckBenchmark.Measure(', type, ')')

    const iterations = 16_000_000
    const V = Value.Create(schema)

    const AC = ajv.compile(schema)
    const A = Benchmark.Measure(() => {
      if (!AC(V)) throw Error()
    }, iterations)

    const TC = TypeCompiler.Compile(schema)
    const T = Benchmark.Measure(() => {
      if (!TC.Check(V)) throw Error()
    }, iterations)
    return { type, ajv: A, typebox: T }
  }

  export function* Execute() {
    for (const [type, schema] of Object.entries(Cases)) {
      if (!TypeGuard.TSchema(schema)) throw Error('Invalid TypeBox schema')
      yield Measure(type, schema)
    }
  }
}