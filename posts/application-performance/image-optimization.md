---
title: 'Image Optimization'
metaDesc: 'Images are commonly the heaviest components of a web page. Optimizing images on website is critical to improve user experience, reduce the costs of content delivery, and enhance SEO.'
socialImage: static-assets/image-optimization-recommended-architecture.png
---
## Overview
Images are commonly the [heaviest](https://almanac.httparchive.org/en/2021/page-weight#fig-2) components of a web page, both in terms of bytes and number of HTTP requests. Optimizing images on website is critical for developers to improve user experience, reduce the costs of content delivery, and enhance SEO. For example, Google’s Largest Contentful Paint metric in their search ranking algorithm is highly impacted by how much images are optimized on the website.

## Architectural decisions
An Image optimization solution can be architected in different ways, according to the tradeoffs (cost, flexibility, performance & complexity) that best meet your business. When architecting an Image optimization solution, you need to make the following technical decisions:

* What image transformations are needed? formatting, resizing, cropping, etc..
* How do we decide which transformation to be applied for a specific image request? On the Front-end (static, responsive design, etc..), on the Edge side (based on request content such as device) or combination of both?
* Where do we execute the transformation? In a central location or in a distributed way?
* When do we execute the transformation? Every time or do we store transformed images for a short duration? Synchronously or Asynchronously?

## Recommended Architecture
The proposed architecture is suitable for most common use cases. Images transformation are executed centrally in an AWS region, only when the image hasn’t been already transformed and stored. The available transformations include resizing and formatting, but can be extended to more operations if needed. Both transformations can be requested by the Front-end, with the possibility of automatic format selection done on edge side. The architecture is based on S3 for storage, CloudFront for content delivery, and Lambda for image processing. The request flow is explained in the next diagram:

![](/static-assets/image-optimization-recommended-architecture.png)

1. The user sends a HTTP request for an image specific transformations, such as encoding and size. The transformations are encoded in the URL, more precisely as comma-separated list of directives as a prefix to the original path.  An example URL would look like this: https://exmaples.com/format=webp,width=200/images/cats/mycat.jpg. 
2. The request is processed by a nearby CloudFront Edge location providing the best performance. Before passing the request upstream, a CloudFront Function is executed on viewer request event to rewrite the request URL. CloudFront Functions is a feature of CloudFront that allows you to write lightweight functions in JavaScript for high-scale, latency-sensitive CDN customizations. In our architecture, we rewrite the URL to:
    1. Validate the requested transformations.
    2. Normalize the URL by ordering transformations and convert them to lower case to increase the cache hit ratio.
    3. When an automatic transformation is requested, decide about the best one to apply. For example, if the user asks for the most optimized image format (JPEG, WebP, or AVIF) using the directive `format=auto`, CloudFront Function will select the best format based on the Accept header present in the request.
3. If the requested image is already cached in CloudFront then there will be a cache hit and the image is returned from CloudFront cache. To increase the cache hit ratio, we enable [Origin shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html), a feature of CloudFront that reduces even more the number of requests to the origin. If the Image is not in CloudFront cache, then the request will be forwarded to S3 . If the requested image is already transformed and stored in S3, then it is simply served and cached in CloudFront.
4. Otherwise, S3 will respond with a 403 error code, which is detected by CloudFront’s [Origin Failover](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/high_availability_origin_failover.html). Thanks to this native feature, CloudFront retries the same URL but this time using the secondary origin based on Lambda URL. When invoked, the Lambda function downloads the original image from S3, transforms it using [Sharp library](https://sharp.pixelplumbing.com/), stores the transformed image in S3, then serve it through CloudFront where it will be cached for future requests. Note the following:
    1. The transformed image is added to S3 with a lifecycle policy that deletes it after a certain duration to reduce the storage cost. Ideally, you’d set this value according to the duration after which your images stop being popular.
    2. For additional access control, CloudFront is configured to send a secret key in a [Custom origin header](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html), which is validated in the Lambda code before processing the image.