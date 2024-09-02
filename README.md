# What is sidecar and service mesh
You can read this: https://www.linkedin.com/pulse/demystifying-service-mesh-side-car-pattern-harsh-sinha-g4y0c


# What is the purpose of this package
To give a prototype of how to provide a sidecar build **(only for nodejs service)** in your own service mesh



# How I can use this package
Generally, you cannot use this builder directly. This package is mainly for study.

If you want try it, you can follow the steps below:
- (1) Make sure you can set up your service mesh
- (2) Modified this builder to make sure the sidecar can be started with your application in a docker
- (3) try to hook your request, this is necessary for those requests sending by sidecar (this package fully support axios, it also provides request-implementation and fetch-implementation without fully tested)
- (4) try some demo in 'test' folder

