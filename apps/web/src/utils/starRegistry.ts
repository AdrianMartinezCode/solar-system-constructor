import * as THREE from 'three';

/**
 * Global registry for star THREE.js object references.
 * This allows components like BodyCameraController to get accurate world positions
 * from the actual rendered scene graph, accounting for all group transformations.
 */
class StarRegistry {
  private refs: Map<string, THREE.Object3D> = new Map();

  /**
   * Register a star's THREE.js object reference
   */
  register(starId: string, object: THREE.Object3D) {
    this.refs.set(starId, object);
  }

  /**
   * Unregister a star when its component unmounts
   */
  unregister(starId: string) {
    this.refs.delete(starId);
  }

  /**
   * Get the world position of a star from the scene graph
   * Returns null if the star is not registered
   */
  getWorldPosition(starId: string): THREE.Vector3 | null {
    const object = this.refs.get(starId);
    if (!object) return null;
    
    // Ensure the world matrix is up-to-date before getting world position
    // This is important because the matrix might not be computed yet on the first frame
    object.updateWorldMatrix(true, false);
    
    const worldPos = new THREE.Vector3();
    object.getWorldPosition(worldPos);
    return worldPos;
  }

  /**
   * Check if a star is registered
   */
  has(starId: string): boolean {
    return this.refs.has(starId);
  }
}

// Singleton instance
export const starRegistry = new StarRegistry();

