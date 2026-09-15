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

- Installing this project now requires Node `^22.15.0 || ^24.0.0 || >=26.0.0`; the current toolchain does not support odd-numbered majors such as Node 23 or 25.
- The development server has been updated to `webpack-dev-server` 6.x together with the matching project-wide Node requirement.
