# ast-maps
Singletrack trail-mapping project for areas with looots of smaller trails

This project has been started to try to accomodate for areas with trail "clusters" that do not fit in with the
many different MTB trail applications out there. The vision is to have a web-application that can be opened 
while you are in the midst of a confusing maze of trails, and it will lead you to the trail you want and provide 
onfo on all surrounding trails.
From a technical perspective the idea is to have a static web-app with no dynamic server-side technology 
requirements. All you should need to do is to add the GPX tracks, add images and fill out some JSON structures
to set up YOUR trail-cluster.

## Development notes

- Node `>=22.15.0 <23` is now required to install dependencies and to build or serve the project locally with the refreshed toolchain.
- Other Node majors are currently unverified for local development with the refreshed dependency stack.
- The development server has been updated to `webpack-dev-server` 6.x together with the matching project-wide Node requirement.

## Deployment

- Pushes to `master` run the GitHub Actions workflow in `.github/workflows/deploy.yml`.
- Add environment secrets named `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to the protected `production` environment so GitHub Actions can deploy to AWS.
- Optional repository variables `AWS_REGION`, `S3_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_IDS` can override the current production defaults.
- When unset, the workflow defaults to region `eu-west-1`, bucket `mtbmaps.net`, and CloudFront distributions `E1XAG5EBVMQWWB` and `E32C96K56BB5FT`, matching `stage_and_deploy.sh`.
