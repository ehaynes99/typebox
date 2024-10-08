/*--------------------------------------------------------------------------

@sinclair/typebox/type

The MIT License (MIT)

Copyright (c) 2017-2024 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import { CreateType } from '../create/type'
import type { TSchema, SchemaOptions } from '../schema/index'
import type { Evaluate, Ensure } from '../helpers/index'
import type { TMappedResult } from '../mapped/index'
import { type TReadonlyOptional } from '../readonly-optional/index'
import { type TOptional, Optional } from '../optional/index'
import { type TReadonly } from '../readonly/index'
import { type TRecursive } from '../recursive/index'
import { type TObject, type TProperties, Object } from '../object/index'
import { type TIntersect, Intersect } from '../intersect/index'
import { type TUnion, Union } from '../union/index'
import { Discard } from '../discard/index'
import { TransformKind } from '../symbols/index'

import { PartialFromMappedResult, type TPartialFromMappedResult } from './partial-from-mapped-result'

// ------------------------------------------------------------------
// TypeGuard
// ------------------------------------------------------------------
import { IsMappedResult, IsIntersect, IsUnion, IsObject } from '../guard/kind'
// ------------------------------------------------------------------
// FromRest
// ------------------------------------------------------------------
// prettier-ignore
type TFromRest<T extends TSchema[], Acc extends TSchema[] = []> = (
  T extends [infer L extends TSchema, ...infer R extends TSchema[]]
    ? TFromRest<R, [...Acc, TPartial<L>]>
    : Acc
)
// prettier-ignore
function FromRest<T extends TSchema[]>(T: [...T]): TFromRest<T> {
  return T.map(L => PartialResolve(L)) as never
}
// ------------------------------------------------------------------
// FromProperties
// ------------------------------------------------------------------
// prettier-ignore
type TFromProperties<T extends TProperties> = Evaluate<{
  [K in keyof T]: 
    T[K] extends (TReadonlyOptional<infer S>) ? TReadonlyOptional<S> : 
    T[K] extends (TReadonly<infer S>) ? TReadonlyOptional<S> : 
    T[K] extends (TOptional<infer S>) ? TOptional<S> : 
    TOptional<T[K]>
}>
// prettier-ignore
function FromProperties<T extends TProperties>(T: T): TFromProperties<T> {
  const Acc = {} as TProperties
  for(const K of globalThis.Object.getOwnPropertyNames(T)) Acc[K] = Optional(T[K])
  return Acc as never
}
// ------------------------------------------------------------------
// FromObject
// ------------------------------------------------------------------
// prettier-ignore
type TFromObject<T extends TObject, Properties extends TProperties = T['properties']> = Ensure<TObject<(
  TFromProperties<Properties>
)>>
// prettier-ignore
function FromObject<T extends TObject>(T: T): TFromObject<T> {
  const options = Discard(T, [TransformKind, '$id', 'required', 'properties'])
  const properties = FromProperties(T['properties'])
  return Object(properties, options) as never
}
// ------------------------------------------------------------------
// PartialResolve
// ------------------------------------------------------------------
// prettier-ignore
function PartialResolve<T extends TSchema>(T: T): TPartial<T> {
  return (
    IsIntersect(T) ? Intersect(FromRest(T.allOf)) :
    IsUnion(T) ? Union(FromRest(T.anyOf)) :
    IsObject(T) ? FromObject(T) :
    Object({})
  ) as never
}
// ------------------------------------------------------------------
// TPartial
// ------------------------------------------------------------------
// prettier-ignore
export type TPartial<T extends TSchema> = (
  T extends TRecursive<infer S extends TSchema> ? TRecursive<TPartial<S>> :
  T extends TIntersect<infer S extends TSchema[]> ? TIntersect<TFromRest<S>> :
  T extends TUnion<infer S extends TSchema[]> ? TUnion<TFromRest<S>> :
  T extends TObject<infer S extends TProperties> ? TFromObject<TObject<S>> :
  TObject<{}>
)
/** `[Json]` Constructs a type where all properties are optional */
export function Partial<T extends TMappedResult>(T: T, options?: SchemaOptions): TPartialFromMappedResult<T>
/** `[Json]` Constructs a type where all properties are optional */
export function Partial<T extends TSchema>(T: T, options?: SchemaOptions): TPartial<T>
/** `[Json]` Constructs a type where all properties are optional */
export function Partial(T: TSchema, options?: SchemaOptions): any {
  if (IsMappedResult(T)) {
    return PartialFromMappedResult(T, options)
  } else {
    // special: mapping types require overridable options
    return CreateType({ ...PartialResolve(T), ...options })
  }
}
