/**
 * Entity types — re-exported from @solar/domain.
 *
 * This file exists as a shim so that existing relative imports
 * throughout the web app continue to work unchanged.
 */
export {
  type Star,
  type PlanetaryRing,
  type CometMeta,
  type LagrangePointMeta,
  type BlackHoleProperties,
  type RoguePlanetMeta,
  type AsteroidBelt,
  type SmallBodyBelt,
  type Position,
  type Group,
  type GroupChild,
  type NestingLevel,
  type ProtoplanetaryDisk,
  type SmallBodyField,
  type NebulaRegion,
} from '@solar/domain';
