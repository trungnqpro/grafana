import { config } from '@grafana/runtime';
import { appendQueryToUrl, toUrlParams, getUrlSearchParams } from 'app/core/utils/url';
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';
import templateSrv from 'app/features/templating/template_srv';
import { PanelModel, dateTime } from '@grafana/data';

export function buildParams(
  panel: PanelModel,
  useCurrentTimeRange: boolean,
  includeTemplateVars: boolean,
  selectedTheme: string
) {
  const params = getUrlSearchParams();

  const range = getTimeSrv().timeRange();
  params.from = range.from.valueOf();
  params.to = range.to.valueOf();
  params.orgId = config.bootData.user.orgId;

  if (!useCurrentTimeRange) {
    delete params.from;
    delete params.to;
  }

  if (includeTemplateVars) {
    templateSrv.fillVariableValuesForUrl(params);
  }

  if (selectedTheme !== 'current') {
    params.theme = selectedTheme;
  }

  if (panel) {
    params.panelId = panel.id;
    params.fullscreen = true;
  } else {
    delete params.panelId;
    delete params.fullscreen;
  }

  return params;
}

export function buildBaseUrl() {
  let baseUrl = window.location.href;
  const queryStart = baseUrl.indexOf('?');

  if (queryStart !== -1) {
    baseUrl = baseUrl.substring(0, queryStart);
  }

  return baseUrl;
}

export function buildShareUrl(
  panel: PanelModel,
  useCurrentTimeRange: boolean,
  includeTemplateVars: boolean,
  selectedTheme: string
) {
  const baseUrl = buildBaseUrl();
  const params = buildParams(panel, useCurrentTimeRange, includeTemplateVars, selectedTheme);

  return appendQueryToUrl(baseUrl, toUrlParams(params));
}

export function buildSoloUrl(
  panel: PanelModel,
  useCurrentTimeRange: boolean,
  includeTemplateVars: boolean,
  selectedTheme: string
) {
  const baseUrl = buildBaseUrl();
  const params = buildParams(panel, useCurrentTimeRange, includeTemplateVars, selectedTheme);

  let soloUrl = baseUrl.replace(config.appSubUrl + '/dashboard/', config.appSubUrl + '/dashboard-solo/');
  soloUrl = soloUrl.replace(config.appSubUrl + '/d/', config.appSubUrl + '/d-solo/');
  delete params.fullscreen;
  delete params.edit;
  return appendQueryToUrl(soloUrl, toUrlParams(params));
}

export function buildImageUrl(
  panel: PanelModel,
  useCurrentTimeRange: boolean,
  includeTemplateVars: boolean,
  selectedTheme: string
) {
  let soloUrl = buildSoloUrl(panel, useCurrentTimeRange, includeTemplateVars, selectedTheme);

  let imageUrl = soloUrl.replace(config.appSubUrl + '/dashboard-solo/', config.appSubUrl + '/render/dashboard-solo/');
  imageUrl = imageUrl.replace(config.appSubUrl + '/d-solo/', config.appSubUrl + '/render/d-solo/');
  imageUrl += '&width=1000&height=500' + getLocalTimeZone();
  return imageUrl;
}

export function buildIframeHtml(
  panel: PanelModel,
  useCurrentTimeRange: boolean,
  includeTemplateVars: boolean,
  selectedTheme: string
) {
  let soloUrl = buildSoloUrl(panel, useCurrentTimeRange, includeTemplateVars, selectedTheme);
  return '<iframe src="' + soloUrl + '" width="450" height="200" frameborder="0"></iframe>';
}

export function getLocalTimeZone() {
  const utcOffset = '&tz=UTC' + encodeURIComponent(dateTime().format('Z'));

  // Older browser does not the internationalization API
  if (!(window as any).Intl) {
    return utcOffset;
  }

  const dateFormat = (window as any).Intl.DateTimeFormat();
  if (!dateFormat.resolvedOptions) {
    return utcOffset;
  }

  const options = dateFormat.resolvedOptions();
  if (!options.timeZone) {
    return utcOffset;
  }

  return '&tz=' + encodeURIComponent(options.timeZone);
}
