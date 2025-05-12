#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { FlightsStack } from '../lib/flights-stack';

const app = new App();
new FlightsStack(app, 'FlightsStack', { env: { region: 'eu-west-1' } });
