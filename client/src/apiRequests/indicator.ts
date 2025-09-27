import http from '@/lib/http'
import {
  DashboardIndicatorQueryParamsType,
  DashboardIndicatorResType
} from '@/schemaValidations/indicator.schema'
import queryString from 'query-string'

const indicatorApiRequest = {
  getDashboardIndicators: (queryParams: DashboardIndicatorQueryParamsType) =>
    http.get<DashboardIndicatorResType>(
      '/indicators/dashboard?' +
        queryString.stringify({
          fromDate: queryParams.fromDate?.toISOString(),
          toDate: queryParams.toDate?.toISOString()
        })
    )
}

export default indicatorApiRequest
