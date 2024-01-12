# HCMUT Courseware Back-end

This repository contains the back-end code for the HCMUT Courseware project, developed as part of our team's Programming Integration Project - Software Engineering course

## Introduction

HCMUT Courseware is a web application that aims to serve as a **centralized** source for learning materials, past exams and practice exams. This project was proposed after our team took notes about the difficulties of students studying at Ho Chi Minh University of Technology (HCMUT). These issues include resource fragmentation, resource quality assurance and lack of a proper feedback loop from which students can use to improve their learning. As of current, we provide three main features to help the learning experience of students at HCMUT become more enjoyable:

- HCMUT Courseware serves as a centralized source for learning resources for students. Educators can upload learning materials, and the system ensures that every students has equal access to them
- The system also serves as a centralized source for past exams, helping students better prepare for the future examinations
- The application allows students to do practice exams, which are created by educators. Exams have clear answers and explanation, which creates a feedback loop to help students improve their learning. Furthermore, the system allows educators to create question banks, and allows dynamic question generation, which allows a single practice exam to be of use to students, even after having been taken multiple times

## Team members

The system's developers includes:

| Name                  | Student ID |
| --------------------- | ---------- |
| Trương Quốc Hưng      | 2153414    |
| Nguyễn Kiều Bảo Khánh | 2152654    |
| Trần Ngọc Đăng Khoa   | 2153473    |
| Nguyễn Trần Khôi      | 2152691    |
| Võ Văn Luân           | 2152744    |
| Trần Duy Minh         | 2152773    |

## Guide to running the code

To run the code locally on your computer, first clone the repository by running (the code shown below performs cloning using SSH, which you may need to perform extra setup to do)

```
git clone git@github.com:qhung312/courseware-be.git
```

Next, install necessary dependencies by issuing the command

```
npm install
```

Then, the application can be run locally by using the command below

```
yarn dev
```
