# Internal shared source

Private workspace package for the pure tree flattener and the Node-only extraction/generation helpers used by the public packages. Each consumer imports only its required modules; there is no catchall barrel joining browser and Node dependencies.

Public builds bundle these shared sources, while Babel and the optional merger remain declared external dependencies of their owning public packages. Do not publish this package or import its source paths from applications. See the root README for public APIs.
