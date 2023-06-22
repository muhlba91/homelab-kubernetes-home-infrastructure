import base64
import datetime
import json


def lambda_handler(event, context):
    """Processes, and transforms, a batch of records."""

    output = [transform_record(record) for record in event["records"]]
    return {"records": output}


def transform_record(record):
    """Transforms a record, sets partition keys, and narks failing records."""

    # record data
    recordId = record["recordId"]
    data = record["data"]

    # result data
    partition_keys = {}
    result = "Ok"

    try:
        data, partition_keys = process_data(record["data"])
    except Exception as err:
        # if any exception happens, we log it and mark the record as failed
        # this allows us post-inspection later
        print(f"error processing record {recordId}.", err, data)
        result = "ProcessingFailed"

    return {
        "recordId": recordId,
        "result": result,
        "data": data,
        "metadata": {"partitionKeys": partition_keys},
    }


def process_data(data):
    """Processes a data point to clean and transform it, and extract partition keys."""

    payload = json.loads(base64.b64decode(data).decode("utf-8"))

    # remove all '_str' postfixes from the keys
    transformed_payload = {
        key.replace("_str", ""): value for (key, value) in payload.items()
    }

    # we receive the timestamp in ms; convert to s
    transformed_payload["timestamp"] = payload["timestamp"] / 1000

    # cleanup partition keys which will be present in the S3 path
    # we rename them to keep the original record available
    # additionally, we set properties for hours and minutes
    date_time = datetime.datetime.fromtimestamp(transformed_payload["timestamp"])
    transformed_payload["date_day"] = int(transformed_payload.pop("day", None))
    transformed_payload["date_month"] = int(transformed_payload.pop("month", None))
    transformed_payload["date_year"] = int(transformed_payload.pop("year", None))
    transformed_payload["time_hour"] = int(f"{date_time:%H}")
    transformed_payload["time_minute"] = int(f"{date_time:%M}")

    # return:
    #   1/ the transformed payload in base64, and
    #   2/ the partition keys
    return base64.b64encode(json.dumps(transformed_payload).encode("utf-8")).decode(
        "utf-8"
    ), {
        "year": transformed_payload["date_year"],
        "month": transformed_payload["date_month"],
        "day": transformed_payload["date_day"],
        "hour": transformed_payload["time_hour"],
        "minute": transformed_payload["time_minute"],
    }
