import {expect} from "assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {HasProps} from "@bokehjs/core/has_props"
import * as mixins from "@bokehjs/core/property_mixins"
import * as p from "@bokehjs/core/properties"
import {keys} from "@bokehjs/core/util/object"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {BYTE_ORDER} from "@bokehjs/core/util/serialization"

class TestModel extends HasProps {}

namespace SubclassWithProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.Property<number>
    bar: p.Property<boolean>
  }
}
interface SubclassWithProps extends SubclassWithProps.Attrs {}
class SubclassWithProps extends HasProps {
  properties: SubclassWithProps.Props
  constructor(attrs?: Partial<SubclassWithProps.Attrs>) {
    super(attrs)
  }
  static init_SubclassWithProps() {
    this.define<SubclassWithProps.Props>(({Boolean, Number}) => ({
      foo: [ Number, 0 ],
      bar: [ Boolean, true ],
    }))
  }
}

namespace SubSubclassWithProps {
  export type Attrs = p.AttrsOf<Props>
  export type Props = SubclassWithProps.Props & {
    baz: p.Property<string>
  }
}
interface SubSubclassWithProps extends SubSubclassWithProps.Attrs {}
class SubSubclassWithProps extends SubclassWithProps {
  properties: SubSubclassWithProps.Props
  constructor(attrs?: Partial<SubSubclassWithProps.Attrs>) {
    super(attrs)
  }
  static init_SubSubclassWithProps() {
    this.define<SubSubclassWithProps.Props>(({String}) => ({
      baz: [ String, "" ],
    }))
  }
}

// TODO {{{
class SubclassWithMixins extends HasProps {}
SubclassWithMixins.mixins(['line'])

class SubSubclassWithMixins extends SubclassWithMixins {}
SubSubclassWithMixins.mixins(['fill:foo_'])

class SubclassWithMultipleMixins extends HasProps {}
SubclassWithMultipleMixins.mixins(['line', 'text:bar_'])
// }}}

namespace SubclassWithNumberSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.NumberSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithNumberSpec extends SubclassWithNumberSpec.Attrs {}
class SubclassWithNumberSpec extends HasProps {
  properties: SubclassWithNumberSpec.Props
  constructor(attrs?: Partial<SubclassWithNumberSpec.Attrs>) {
    super(attrs)
  }
  static init_SubclassWithNumberSpec() {
    this.define<SubclassWithNumberSpec.Props>(({Boolean}) => ({
      foo: [ p.NumberSpec, {field: "colname"} ],
      bar: [ Boolean, true ],
    }))
  }
}

namespace SubclassWithDistanceSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.DistanceSpec
    bar: p.Property<boolean>
  }
}
interface SubclassWithDistanceSpec extends SubclassWithDistanceSpec.Attrs {}
class SubclassWithDistanceSpec extends HasProps {
  properties: SubclassWithDistanceSpec.Props
  constructor(attrs?: Partial<SubclassWithDistanceSpec.Attrs>) {
    super(attrs)
  }
  static init_SubclassWithDistanceSpec() {
    this.define<SubclassWithDistanceSpec.Props>(({Boolean}) => ({
      foo: [ p.DistanceSpec, {field: "colname"} ],
      bar: [ Boolean, true ],
    }))
  }
}

namespace SubclassWithOptionalSpec {
  export type Attrs = p.AttrsOf<Props>
  export type Props = HasProps.Props & {
    foo: p.NumberSpec
    bar: p.Property<boolean>
    baz: p.NumberSpec
  }
}
interface SubclassWithOptionalSpec extends SubclassWithOptionalSpec.Attrs {}
class SubclassWithOptionalSpec extends HasProps {
  properties: SubclassWithOptionalSpec.Props
  constructor(attrs?: Partial<SubclassWithOptionalSpec.Attrs>) {
    super(attrs)
  }
  static init_SubclassWithOptionalSpec() {
    this.define<SubclassWithOptionalSpec.Props>(({Boolean}) => ({
      foo: [ p.NumberSpec, undefined, {optional: true} ],
      bar: [ Boolean, true ],
      baz: [ p.NumberSpec, {field: "colname"} ],
    }))
  }
}

describe("core/has_props module", () => {

  describe("creation", () => {

    it("should have only id property", () => {
      const obj = new TestModel()
      expect(keys(obj.properties)).to.be.equal(['id'])
      expect(keys(obj.attributes)).to.be.equal(['id'])
    })

    it("should combine props from subclasses", () => {
      const obj = new SubclassWithProps()
      expect(keys(obj.properties)).to.be.equal(['id', 'foo', 'bar'])
    })

    it("should combine props from sub-subclasses", () => {
      const obj = new SubSubclassWithProps()
      expect(keys(obj.properties)).to.be.equal(['id', 'foo', 'bar', 'baz'])
    })

    it("should combine mixins from subclasses", () => {
      const obj = new SubclassWithMixins()
      const props = keys(mixins.Line)
      expect(keys(obj.properties)).to.be.equal(['id'].concat(props))
    })

    it("should combine mixins from sub-subclasses", () => {
      const obj = new SubSubclassWithMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Fill).map((key) => `foo_${key}`)]
      expect(keys(obj.properties)).to.be.equal(['id'].concat(props))
    })

    it("should combine multiple mixins from subclasses", () => {
      const obj = new SubclassWithMultipleMixins()
      const props = [...keys(mixins.Line), ...keys(mixins.Text).map((key) => `bar_${key}`)]
      expect(keys(obj.properties)).to.be.equal(['id'].concat(props))
    })
  })

  describe("materialize_dataspecs", () => {
    it("should collect dataspecs", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithNumberSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.equal({_foo: new Float32Array([1, 2, 3, 4])})
    })

    it("should collect shapes when they are present", () => {
      const array = ndarray([1, 2, 3, 4], {shape: [2, 2]})
      const r = new ColumnDataSource({data: {colname: array}})
      const obj = new SubclassWithNumberSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.equal({_foo: ndarray([1, 2, 3, 4], {shape: [2, 2]})})
    })

    it("should collect max vals for distance specs", () => {
      const r0 = new ColumnDataSource({data: {colname: [1, 2, 3, 4, 2]}})
      const obj = new SubclassWithDistanceSpec()

      const data0 = obj.materialize_dataspecs(r0)
      expect(data0).to.be.equal({_foo: new Float32Array([1, 2, 3, 4, 2]), max_foo: 4})

      const array1 = ndarray([1, 2, 3, 4, 2], {shape: [2, 2]})
      const r1 = new ColumnDataSource({data: {colname: array1}})
      const data1 = obj.materialize_dataspecs(r1)
      expect(data1).to.be.equal({_foo: ndarray([1, 2, 3, 4, 2], {shape: [2, 2]}), max_foo: 4})
    })

    it("should collect ignore optional specs with null values", () => {
      const r = new ColumnDataSource({data: {colname: [1, 2, 3, 4]}})
      const obj = new SubclassWithOptionalSpec()
      const data = obj.materialize_dataspecs(r)
      expect(data).to.be.equal({_baz: new Float32Array([1, 2, 3, 4])})
    })
  })

  describe("HasProps.struct()", () => {

    it("should return a correct struct for a standard HasProps", () => {
      const obj = new TestModel()
      const struct = obj.struct()
      expect(struct.id).to.be.equal(obj.id)
      expect(struct.type).to.be.equal(obj.type)
      expect(struct.subtype).to.be.undefined
    })

    it("should return a correct struct for a subtype HasProps", () => {
      const obj = new TestModel()
      obj._subtype = "bar"
      const struct = obj.struct()
      expect(struct.id).to.be.equal(obj.id)
      expect(struct.type).to.be.equal(obj.type)
      expect(struct.subtype).to.be.equal("bar")
    })
  })

  describe("HasProps._value_to_json()", () => {
    it("should support primitive values", () => {
      expect(HasProps._value_to_json(1)).to.be.equal(1)
      expect(HasProps._value_to_json("a")).to.be.equal("a")
    })

    it("should support HasProps instances", () => {
      const obj0 = new TestModel()
      expect(HasProps._value_to_json(obj0)).to.be.equal({id: obj0.id})

      const obj1 = new SubSubclassWithProps({foo: 17})
      expect(HasProps._value_to_json(obj1)).to.be.equal({id: obj1.id})
    })

    it("should support ndarrays", () => {
      const nd0 = ndarray([1, 2, 3, 4, 5, 6], {dtype: "int32", shape: [2, 3]})

      expect(HasProps._value_to_json(nd0)).to.be.equal({
        __ndarray__: "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAA",
        order: BYTE_ORDER,
        dtype: "int32",
        shape: [2, 3],
      })
    })

    it("should support typed arrays", () => {
      expect(HasProps._value_to_json(new Float32Array([1, 2, 3]))).to.be.equal([1, 2, 3])
    })

    it("should support arrays and typed arrays", () => {
      const obj0 = new TestModel()

      expect(HasProps._value_to_json([1, 2, 3])).to.be.equal([1, 2, 3])
      expect(HasProps._value_to_json([1, 2, obj0])).to.be.equal([1, 2, {id: obj0.id}])
    })

    it("should support plain objects", () => {
      const obj0 = new TestModel()

      expect(HasProps._value_to_json({a: 1, b: 2})).to.be.equal({a: 1, b: 2})
      expect(HasProps._value_to_json({a: 1, b: obj0})).to.be.equal({a: 1, b: {id: obj0.id}})
    })
  })
})
